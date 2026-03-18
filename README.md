# Sub0 Frontend

Sub0 frontend is the user-facing dashboard for the Sub0 prediction market platform. It is a Next.js 16 application that lets users:

- Browse and filter markets
- Trade on markets (user orders with EIP‑712 signatures)
- Create and manage AI trading agents
- Run Tenderly-backed simulations in the **Simulate** sandbox
- Track agent performance and positions in the **Tracker** view

The app talks only to the Sub0 backend (`sub0server`) over REST and WebSocket; it never calls CRE or Tenderly directly.

---

## 1. High‑level architecture

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **State management**: Redux Toolkit (`src/store`) with slices for markets, agents, layout, positions, trades, websocket state, simulate state, and theme
- **Auth**: Thirdweb wallet auth; `AuthContext` wraps the app and calls backend `GET /api/auth/me` for the current user
- **Design system**: Tailwind CSS + custom components; no CSS frameworks beyond Tailwind
- **WebSocket**: Single connection to backend `/ws`, managed by `WebSocketConnector` and hooks under `src/lib/websocket`
- **Backend integration**: Typed API helpers under `src/lib/api/*` (markets, agents, orders, simulations, settings)

Layout:

- `app/layout.tsx` – root layout; wraps children in `AppProviders` and `DashboardLayout`
- `DashboardLayout` – top nav, filter bar, primary tab content, bottom nav, and a hidden `WebSocketKeeper` so subscriptions remain active when you navigate
- `PrimaryTabs` + `TopNav` – main navigation: **Markets**, **Trade**, **Tracker**, **Simulate**, **Settings**

---

## 2. User flows

### 2.1 Markets

- **Page**: `/` (home) – `DashboardLayout` with `DraggableColumns`
- **What users see**:
  - Market list with search/filter (status, date, etc.)
  - Per‑market cards with name, outcomes, prices, and quick links
  - Live updates as trades happen (via WebSocket `MARKET_UPDATED`, `ORDER_BOOK_UPDATE`, `TRADE_EXECUTED`)
- **How it works**:
  - On first load, `DashboardLayout` dispatches `fetchMarkets({ limit: 50 })` then `fetchOrderBooksForList()`
  - `useMarketSocket` subscribes to `market:{marketId}` rooms for all visible markets
  - Redux slices (`marketsSlice`, `recentTradesSlice`) keep the list and recent trades in sync with WebSocket events

### 2.2 Trade

- **Page**: `/trade` – `EnhancedTradeTab`
- **What users see**:
  - User positions and agent positions (toggleable)
  - Recent trades with links back to market detail
- **Flow for placing a trade** (from a market detail page):
  1. User connects wallet via Thirdweb and signs in (wallet auth).
  2. In `MarketTradePanel`, the user selects outcome and side and enters size.
  3. The frontend calls `buildUserTradeTypedData` and asks the wallet to sign the EIP‑712 **UserTrade** message.
  4. It posts to backend `POST /api/orders` with the order parameters, `userSignature`, `tradeCostUsdc`, `nonce`, and `deadline`.
  5. Backend validates the quote, runs the matching engine, persists trades, and may call CRE to execute on‑chain. WebSocket broadcasts `ORDER_BOOK_UPDATE` and `TRADE_EXECUTED`; the frontend updates the order book and recent trades list.

### 2.3 Agents and Tracker

- **Main surfaces**:
  - **Agents column** in the Markets layout (public + owned agents)
  - **Tracker** page (`/tracker`) – `TrackerLayout` (Agents, Statistics, Markets columns)
- **What users see**:
  - List of public agents (performance, volume, PnL)
  - Owned agents with balances and wallet status (complete/incomplete)
  - Aggregate stats and markets traded for a selected agent
- **How it works**:
  - `AgentsColumn` calls `GET /api/agents/public` for public agents and `GET /api/agents` (auth) for owned agents.
  - `TrackerLayout` manages three columns: `TrackerAgentColumn`, `TrackerStatsColumn`, `TrackerMarketsColumn`. Column order and widths are stored in the Redux `layoutSlice` and persisted to localStorage.
  - Agent updates, balance changes, and AI analysis are streamed over WebSocket rooms like `agent:{agentId}` and `market:{marketId}:agent:{agentId}`; see `enhanced-ws.md` for details.

### 2.4 Simulate

- **Page**: `/simulate` – `SimulateLayout`
- **Columns**:
  - **Discovery & Analysis** (`SimulateDiscoveredColumn`): list of markets enqueued for this simulation, with status (PENDING, TRADED, DISCARDED) and the agent’s reason.
  - **Probability & Positions** (`SimulateProbabilityChartColumn`): per‑outcome probabilities and positions over time.
  - **Agent config** (`SimulateAgentConfigColumn`): pick an agent, see simulate chain config, balances, funding eligibility, and run the config editor.
- **How a simulation runs**:
  1. User selects an agent and a date range; optionally adjusts `Markets` and `Time (min)`.
  2. Frontend calls `POST /api/simulate/start` with `{ agentId, dateRange, maxMarkets, durationMinutes }`.
  3. Backend:
     - Optionally charges the agent via x402 on Base (if enabled).
     - Finds markets in the date range and creates a Simulation + AgentEnqueuedMarket rows with `chainKey: "tenderly"` and simulationId.
     - Enqueues BullMQ jobs; the agent worker runs analysis on the Tenderly chain.
  4. `SimulateDiscoveredColumn` polls `GET /api/agents/:id/enqueued-markets?chainKey=tenderly&simulationId=...` and merges pages so only changed rows re‑render; a 15‑second interval keeps the list fresh while the simulation is running.
  5. The countdown, queue stats, and list update live as jobs complete.
  6. Users can stop or extend the simulation; extend calls `POST /api/simulate/extend` and refreshes the list and timer.

### 2.5 Settings

- **Page**: `/settings` – composed of tabs (Profile, Wallets, Agents, Simulations) in `Settings` components.
- **Endpoints used** (from backend):
  - `GET /api/settings/profile`, `PATCH /api/settings/profile`
  - `GET /api/settings/vault/balance`, `POST /api/settings/vault/deposit`, `POST /api/settings/vault/withdraw`
  - `GET /api/simulations`, `GET /api/simulations/:id`, `DELETE /api/simulations/:id`

---

## 3. Technology stack and key modules

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Redux Toolkit** (`src/store`):
  - `themeSlice` – theme + font + size preferences
  - `layoutSlice` – active primary tab, column ordering and sizes, selected agents for Tracker and Simulate
  - `marketsSlice` – list, detail, order book fetches
  - `agentsSlice` – owned + public agents
  - `positionsSlice`, `recentTradesSlice` – derived from WebSocket and REST
  - `marketAgentsSlice`, `simulateDiscardedSlice`, etc.
- **Auth**:
  - `ThirdwebProvider` – wallet connect and auth
  - `AuthContext` – fetches `GET /api/auth/me` and exposes `{ user, loading, error }`
- **WebSocket**:
  - `WebSocketConnector` – single connection to backend `/ws`
  - Hooks: `useWebSocket`, `useMarketSocket`, `useLiveMarketData`, etc.
  - Rooms and events documented in `md/websocket.integration.md` and `md/enhanced-ws.md`
- **Charts**:
  - `recharts`, `lightweight-charts`, and SciChart (for more advanced plots where needed)

---

## 4. Environment variables

Frontend env vars are defined in the root `env.local.example` under the `sub0` section.

Essential:

- `NEXT_PUBLIC_BACKEND_URL` – e.g. `http://localhost:4000`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` – client id from Thirdweb
- `NEXT_PUBLIC_APP_DOMAIN` – e.g. `localhost:3000`

Optional:

- `NEXT_PUBLIC_WEBSOCKET_URL` – override for WebSocket; defaults to `<BACKEND_URL>/ws` on localhost
- `NEXT_PUBLIC_BLOCK_EXPLORER_URL` – base URL for tx links
- `NEXT_PUBLIC_USDC_DAILY_MINT_CAP` – dev‑only mint limit display

These go into `sub0/.env.local`. For server‑only Thirdweb keys (`THIRDWEB_SECRET_KEY`, `THIRDWEB_AUTH_PRIVATE_KEY`) use `sub0server/.env` instead.

---

## 5. Running the frontend

Prerequisites:

- Backend (`sub0server`) running on port 4000 (or update `NEXT_PUBLIC_BACKEND_URL`)
- PostgreSQL and Redis running for the backend

Steps:

```bash
cd sub0
pnpm install
# ensure sub0/.env.local exists with the frontend section from env.local.example
pnpm dev
```

Then open `http://localhost:3000`.

For a quick full‑stack dev setup:

1. Start backend: `cd sub0server && pnpm dev`
2. Start frontend: `cd sub0 && pnpm dev`
3. (Optional) Start agent worker: `cd sub0server && pnpm worker`

---

Here’s an updated version of that section using real GitHub URLs:

---

## 6. Where to look for more detail

* **Backend API details**:
  [https://github.com/nyuiela/sub0/blob/main/md/backend-overview.md](https://github.com/nyuiela/sub0/blob/main/md/backend-overview.md)
  [https://github.com/nyuiela/sub0server/blob/main/README.md](https://github.com/nyuiela/sub0server/blob/main/README.md)

* **Agents**:
  [https://github.com/nyuiela/sub0/blob/main/md/agent.trading.system.md](https://github.com/nyuiela/sub0/blob/main/md/agent.trading.system.md)
  [https://github.com/nyuiela/sub0server/blob/main/md/agents.api.md](https://github.com/nyuiela/sub0server/blob/main/md/agents.api.md)

* **Orders and trades**:
  [https://github.com/nyuiela/sub0/blob/main/md/order-trades.md](https://github.com/nyuiela/sub0/blob/main/md/order-trades.md)
  [https://github.com/nyuiela/sub0server/blob/main/md/orders-trades.api.md](https://github.com/nyuiela/sub0server/blob/main/md/orders-trades.api.md)

* **WebSocket**:
  [https://github.com/nyuiela/sub0/blob/main/md/websocket.integration.md](https://github.com/nyuiela/sub0/blob/main/md/websocket.integration.md)
  [https://github.com/nyuiela/sub0server/blob/main/md/enhanced-websocket-integration.frontend.md](https://github.com/nyuiela/sub0server/blob/main/md/enhanced-websocket-integration.frontend.md)

* **Simulate**:
  [https://github.com/nyuiela/sub0server/blob/main/src/routes/simulate.routes.ts](https://github.com/nyuiela/sub0server/blob/main/src/routes/simulate.routes.ts)
  [https://github.com/nyuiela/sub0/tree/main/src/components/layout/SimulateLayout](https://github.com/nyuiela/sub0/tree/main/src/components/layout/SimulateLayout)

---
