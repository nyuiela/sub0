# Agent Trading System

This document describes how the AI agent works end-to-end for trading: how markets are discovered, how the agent is triggered, how it decides to trade, and how orders and follow-ups are handled. It covers both **main** (live) and **simulate** (sandbox) flows.

---

## 1. Overview

- **Agents** are entities that can run trading analysis on **markets** and submit orders (buy/sell) via the backend.
- Markets are **not** chosen by the agent at runtime; they are **enqueued** per agent (user adds markets, or discovery/cron adds them). Each job is one `(agentId, marketId, chainKey)` pair.
- The **agent worker** (BullMQ) processes jobs: loads agent + market, calls the LLM (**trading analysis**), then either skips (with optional follow-up time) or submits a **MARKET** order to the backend. The backend matching engine executes the order; trades are persisted and may be executed on-chain (CRE) for the relevant chain (main or Tenderly simulate).
- **Main** flow can be fully automatic (discovery + cron trigger + worker). **Simulate** flow is user-triggered (date range + Start simulation, then Run analysis) and the agent is instructed to use only information within the simulation date range.

---

## 2. Data Model (Relevant Parts)

| Concept | Description |
|--------|-------------|
| **Agent** | Has name, persona, model (Gemini/Grok), wallet, balance. Must be ACTIVE to trade. |
| **AgentEnqueuedMarket** | One row per (agentId, marketId). Stores chainKey (main \| tenderly), status (PENDING \| DISCARDED \| TRADED), nextRunAt, discardReason. For simulate: optional simulateDateRangeStart / simulateDateRangeEnd. |
| **AgentChainBalance** | Balance per agent per chainKey (main vs tenderly). Used for simulate balance display; main can fall back to Agent.balance. |
| **BullMQ queue** | Queue name `agent-prediction`. Jobs carry agentId, marketId, chainKey. |

---

## 3. How Markets Get Onto an Agent (Discovery and Enqueue)

### 3.1 Main (live)

- **Discovery (automatic)**  
  When **POST /api/agent/trigger-all** is called (e.g. by cron), if `config.agentDiscoveryEnabled` is true:
  - Backend fetches OPEN markets (status=OPEN, questionId not null), up to `agentDiscoveryMarketsLimit`.
  - For each **ACTIVE** agent, it loads that agent’s already-enqueued market IDs (chainKey=main).
  - For each OPEN market not yet enqueued for that agent, it enqueues a job and upserts **AgentEnqueuedMarket** (agentId, marketId, chainKey=main). It caps new enqueues per agent at `agentDiscoveryMaxNewPerAgentPerRun`.
- **Manual enqueue**  
  User (or API) calls **POST /api/agent/enqueue** with `{ marketId, agentId }` (optionally chainKey=main). Backend adds a repeating job (every 60s) and upserts AgentEnqueuedMarket.

So on main, the agent gets markets by: (1) discovery in trigger-all, and (2) manual “Add to agent”.

### 3.2 Simulate

- **Start simulation (date range)**  
  User picks a date range and clicks **Start simulation**. Frontend calls **POST /api/simulate/start** with `{ agentId, dateRange: { start, end } }`. Backend:
  - Finds markets that were active or resolved in that range (resolutionDate in range, or createdAt ≤ end and resolutionDate > end).
  - For each such market, upserts **AgentEnqueuedMarket** with chainKey=tenderly and **simulateDateRangeStart** / **simulateDateRangeEnd**.
  - Enqueues a **one-off** job per market (enqueueAgentPredictionNow) with chainKey=tenderly.
- **Manual enqueue**  
  User can still add individual markets from the Simulate UI (Add to agent with chainKey=tenderly). No date range is stored unless they also use Start simulation for that run.

So on simulate, the agent gets markets by: (1) Start simulation (discovers by date range and enqueues + triggers), and (2) manual add + Run analysis.

---

## 4. How the Agent Is Triggered to Run

### 4.1 Main

| Trigger | Who | What happens |
|--------|-----|----------------|
| **Enqueue** | User or discovery | Adds a **repeating** job (every 60s) for (agentId, marketId, main). First run can be soon. |
| **POST /api/agent/:id/trigger** | User (e.g. “Run analysis”) | For that agent, enqueues a **one-off** job for every enqueued market (main). |
| **POST /api/agent/trigger-all** | Cron (API key) | (1) Discovery: add new OPEN markets per agent (main only). (2) For all AgentEnqueuedMarket rows with chainKey=main, status PENDING or TRADED, and nextRunAt null or due, enqueue a **one-off** job per row. |

So on main, the agent runs when: jobs are already on the queue from enqueue/trigger, and when cron calls trigger-all it both discovers new markets and re-enqueues due (main) markets for another run.

### 4.2 Simulate

| Trigger | Who | What happens |
|--------|-----|----------------|
| **Start simulation** | User | Discovers markets in date range, enqueues them with chainKey=tenderly and date range, and enqueues one-off jobs (so analysis runs without a separate “Run analysis” click if desired). |
| **POST /api/agent/:id/trigger** with body `{ chainKey: "tenderly" }` | User (“Run analysis” on Simulate) | Enqueues a one-off job for every enqueued market for that agent with chainKey=tenderly. |

Cron **does not** trigger simulate: trigger-all only considers chainKey=main. So simulate runs only when the user starts a simulation or clicks Run analysis.

---

## 5. What the Worker Does (One Job = One Market, One Agent)

The **agent worker** (BullMQ) runs in a separate process and consumes the `agent-prediction` queue.

1. **Load job payload**  
   agentId, marketId, chainKey (main or tenderly).

2. **Guard: trading enabled**  
   If `config.agentTradingEnabled` is false, exit.

3. **Load data**  
   - **AgentEnqueuedMarket** row (nextRunAt, simulateDateRangeStart/End).
   - **Agent** (name, persona, status, wallet, balance, modelSettings).
   - **Market** (name, outcomes, status).

4. **Guard: nextRunAt**  
   If nextRunAt is set and in the future, skip (job completes without running analysis).

5. **Guard: agent and market**  
   Agent must exist and be ACTIVE. For **main**, market must be OPEN. For **simulate** (chainKey=tenderly), market can be any status (e.g. resolved) so we can backtest.

6. **Trading analysis (LLM)**  
   Call **runTradingAnalysis** with:
   - marketName, outcomes, agentName, personaSummary, model.
   - If simulate and the row has simulateDateRangeEnd: **simulationContext** with asOfDate / dateRangeEnd (and optionally dateRangeStart). The prompt then tells the LLM to use only information available on or before that date and not to use knowledge of resolution.

   The LLM returns a **TradingDecision**: action (skip \| buy \| sell), outcomeIndex, quantity, reason, and optional **nextFollowUpInMs** (when to run this market again, capped at 7 days).

7. **If action is skip**  
   - Update AgentEnqueuedMarket: status=DISCARDED, discardReason=reason, nextRunAt = now + nextFollowUpInMs (or default 1h) if > 0.
   - Job ends. When cron runs trigger-all again, this market will be re-enqueued if nextRunAt is due (main only).

8. **If action is buy or sell**  
   - Resolve outcomeIndex and quantity (default outcome 0, quantity "1").
   - **Wallet check**: agent must have a complete wallet (address + encrypted private key). If not, create a **PendingAgentTrade** (NO_WALLET) and exit.
   - **Balance check**: agent.balance (main) must be ≥ quantity. If not, create PendingAgentTrade (INSUFFICIENT_BALANCE) and exit.
   - **Submit order**: HTTP **POST /api/orders** with x-api-key, body: marketId, outcomeIndex, side (BID/ASK), type=MARKET, quantity, agentId. No chainKey in the order body; execution path (main vs Tenderly) is determined by the rest of the system (e.g. CRE/trades persistence may use chain context elsewhere).
   - If the order request succeeds: update AgentEnqueuedMarket to status=TRADED, nextRunAt = now + nextFollowUpInMs (or default 24h). If chainKey is main, call **sync balance** (POST /api/agents/:id/sync-balance) so Agent.balance is refreshed from chain.
   - If the order request fails: log error; row is not updated so the market can be retried on a later trigger.

So in one sentence: the worker loads one (agent, market), asks the LLM whether to skip or trade, and either updates the enqueued row with a follow-up time or submits a MARKET order and then updates the row and optionally syncs balance.

---

## 6. Order Execution and Downstream

- **POST /api/orders** (with agentId) is handled by the backend: it builds an order input and calls **submitOrder** (matching engine). The engine matches the order and produces **trades**.
- Trades are published (e.g. Redis), persisted (DB), and market stats are updated. For **main**, trades may be executed on-chain via CRE (user and agent execution paths). For **simulate**, the same order API is used; execution context (Tenderly vs main) is determined by configuration and how the backend/CRE route the trade.
- The agent does not “see” the result of the trade inside the same job; it only sees success/failure of the HTTP call. Follow-up is via **nextRunAt**: when cron (main) or user (simulate) triggers again, the same market can be run again.

---

## 7. Reminder / “Come Back Later”

- The LLM can return **nextFollowUpInMs**. The worker writes **nextRunAt = now + nextFollowUpInMs** (or defaults: 24h after trade, 1h after skip) on AgentEnqueuedMarket.
- **Main**: When cron calls **POST /api/agent/trigger-all**, it selects enqueued markets where nextRunAt is null or ≤ now and enqueues one-off jobs for them. So the agent “comes back” to that market on the next cron run after the reminder time.
- **Simulate**: There is no cron for tenderly. To “come back,” the user must click **Run analysis** again; the same enqueued markets (with their nextRunAt) will get new jobs. The worker still respects nextRunAt (if in the future it skips), so if you wanted to simulate “come back in 1h,” you would need to trigger again after 1h.

So the “reminder” is stored (nextRunAt); the “cron” that picks it up is trigger-all for main only.

### 7.1 Reminders are per market (and per position/trade)

Each job is for **one** (agent, market). When the agent runs on market A, it decides skip / buy / sell and can set **nextFollowUpInMs** (e.g. check back in 24h). That value is stored as **nextRunAt** only for **that** (agentId, marketId) row. So the reminder is explicitly **for that market**: for market A, based on my research now I am holding (or not changing my position); I am setting a timer to resume and check back on **this** market to see if I will update the position, maintain it, or set another reminder until the market ends or the result is published. Markets B, C, D each have their own nextRunAt. When trigger-all (main) or the user (simulate) runs, every (agent, market) pair with nextRunAt due gets a job, so the agent re-runs **per market** and can set a new reminder for that same market again.

### 7.2 Early resolution (result available before official end date)

Example: market "Will 50 Cent's album drop by end of February?" is set to end in Feb, but the album drops the next day or a few hours later, so the **result** is known and the market is resolved (e.g. status CLOSED, result published) before the calendar end date.

- **Main**: The worker does **not** run analysis when the market is no longer OPEN. So once the market is RESOLVING or CLOSED, that (agent, market) job is skipped. Reminders for that market still exist in the DB (nextRunAt), and trigger-all will keep enqueueing jobs for it when due, but the worker will exit immediately for that market. So on main, the agent **stops** acting on that market once it is no longer OPEN; it does not keep checking back after resolution.
- **Simulate**: The worker **does** run on resolved markets (we allow any status when chainKey is tenderly so we can backtest). The prompt includes **SIMULATION MODE** and says: the market may since have resolved; do NOT use knowledge of the resolution or any event after this date. So the agent is told to reason **as of** the simulation date and to ignore the fact that the market has already resolved. In the "album dropped next day" case: (1) If the simulation **asOfDate** is **before** the album dropped, the agent has no way to know the album dropped; it will decide hold/sell/buy as if the market were still open. (2) If the simulation **asOfDate** is **after** the album dropped, we still tell the agent not to use knowledge of the resolution, so the backtest stays fair; the agent may set another reminder for that market and on the next user trigger the same market can run again with the same asOfDate constraint.

So: on **main**, reminders effectively stop for a market once it is no longer OPEN. On **simulate**, we continue to run the agent on that market for backtest realism and rely on the prompt to forbid using resolution knowledge.

---

## 8. End-to-End Flows (Summary)

### Main (live) – automatic

1. Cron calls **POST /api/agent/trigger-all** (API key).
2. Discovery: fetch OPEN markets; for each ACTIVE agent, enqueue new (agentId, marketId, main) up to a cap per agent.
3. For all (agentId, marketId, main) with status PENDING or TRADED and nextRunAt due, enqueue one-off jobs.
4. Worker processes each job: load agent + market + enqueued row → runTradingAnalysis (no simulationContext) → skip (set nextRunAt) or submit MARKET order → update row (TRADED + nextRunAt) and optionally sync balance.
5. Next cron run repeats step 2–4, so new markets are discovered and due markets get another analysis.

### Simulate – user-driven

1. User selects agent and date range, clicks **Start simulation**. Frontend calls **POST /api/simulate/start** with agentId and dateRange.
2. Backend finds markets in range, upserts AgentEnqueuedMarket (chainKey=tenderly, simulateDateRangeStart/End), and enqueues one-off jobs with chainKey=tenderly.
3. User may also add markets manually and click **Run analysis** (POST /api/agent/:id/trigger with chainKey=tenderly), which enqueues one-off jobs for all enqueued tenderly markets.
4. Worker processes each job: load agent + market + enqueued row (including simulate date range) → runTradingAnalysis **with simulationContext** (asOfDate = simulateDateRangeEnd) so the LLM only uses information within the date range → skip or submit order → update row. Market may be resolved; the agent is instructed not to use that knowledge.
5. No automatic re-trigger; user clicks **Run analysis** again to re-run or “come back” to the same markets.

---

## 9. Configuration (Backend)

| Config / env | Purpose |
|--------------|---------|
| **AGENT_TRADING_ENABLED** | If false, worker does not run analysis or submit orders. |
| **agentDiscoveryEnabled** | If true, trigger-all runs discovery (main). Default on; set via AGENT_DISCOVERY_ENABLED=false to disable. |
| **agentDiscoveryMaxNewPerAgentPerRun** | Max new markets enqueued per agent per trigger-all. Default 10. |
| **agentDiscoveryMarketsLimit** | Max OPEN markets fetched for discovery. Default 50. |
| **API_KEY** | Used by the worker to call POST /api/orders and POST .../sync-balance. |
| **backendUrl** | Base URL for the worker’s HTTP calls (orders, sync-balance). |
| **redisUrl** | BullMQ connection for the agent-prediction queue. |

---

## 10. Summary Diagram (Conceptual)

```text
[ MAIN ]
  Cron → POST /api/agent/trigger-all
    → Discovery: OPEN markets → enqueue (agent, market, main) for each ACTIVE agent (capped)
    → Due rows (main, nextRunAt ≤ now) → enqueue one-off jobs
  Queue (agent-prediction) ← jobs (agentId, marketId, chainKey=main)
  Worker → runTradingAnalysis → skip (nextRunAt) | POST /api/orders (MARKET) → TRADED + nextRunAt
  Orders → matching engine → trades → persistence / CRE (main chain)

[ SIMULATE ]
  User → Start simulation (date range) → POST /api/simulate/start
    → Markets in range → enqueue (agent, market, tenderly) + simulateDateRangeStart/End
    → enqueue one-off jobs (chainKey=tenderly)
  User → Run analysis → POST /api/agent/:id/trigger { chainKey: "tenderly" }
    → enqueue one-off jobs for all enqueued tenderly markets
  Queue ← jobs (agentId, marketId, chainKey=tenderly)
  Worker → runTradingAnalysis(simulationContext = asOfDate) → skip | POST /api/orders
  (No cron; user triggers again to “come back”.)
```

This is the entire system for how the agent works with respect to trading on both main and simulate.
