# Settings API Report (Backend)

This document describes all settings implemented in the Sub0 frontend so the backend can provide API endpoints to store and update them. Auth is assumed to be session/JWT (credentials: include).

---

## 1. Overview

| Section | Purpose | Frontend status | Backend requirement |
|--------|----------|------------------|---------------------|
| Profile | Global user profile (username, email), wallet display, summary stats | Form submits; no API yet | New: GET/PATCH profile, optional stats |
| Agent Studio | Per-agent config: OpenClaw docs, strategy, model, tools | Uses existing PATCH /api/agents/:id | Extend modelSettings shape |
| Vault & Funds | USDC balance, deposit, withdraw | Placeholder; no API | Balance endpoint; deposit/withdraw (or contract) |
| Developer API | API keys / integration | Placeholder UI | Future: API key CRUD |

---

## 2. Profile Settings

**Scope:** One profile per authenticated user (identified by session / wallet address).

### 2.1 Payload (align with frontend Zod)

```ts
// GET response / PATCH body (all optional for PATCH)
{
  "username": string | null;  // max 64, optional; empty string allowed in form
  "email": string | null;    // valid email or empty string
}
```

### 2.2 Validation (mirror frontend profileSchema)

- `username`: optional; if present, length 1–64 (or allow empty string and store null).
- `email`: optional; if present, must be valid email (or empty string → null).

### 2.3 Suggested endpoints

- **GET /api/settings/profile** (or **GET /api/users/me** including profile)
  - Returns: `{ username?: string | null, email?: string | null }`
  - Optional: `globalPnl`, `totalVolume` for summary cards (see 2.4).

- **PATCH /api/settings/profile** (or **PATCH /api/users/me**)
  - Body: `{ username?: string, email?: string }`
  - Returns: updated profile (same shape as GET).

### 2.4 Optional summary stats (Profile tab cards)

Frontend shows “Global PnL” and “Total Volume” (currently placeholders). If backend can aggregate:

- **GET /api/settings/profile** (or a dedicated stats endpoint) may include:
  - `globalPnl: number` (or string for precision)
  - `totalVolume: number` (or string)

No separate endpoint is required if these are included in the profile GET.

---

## 3. Agent Studio Settings

**Scope:** Per-agent configuration. Create/read/update already use **POST /api/agents**, **GET /api/agents/:id**, **PATCH /api/agents/:id**. This section defines the **shape of `modelSettings`** (and related fields) the frontend sends and expects.

### 3.1 PATCH /api/agents/:id body (update)

Frontend sends:

```ts
{
  "name"?: string;           // 1–120 chars
  "persona"?: string;        // max 50_000; primary system prompt (openclaw.persona)
  "modelSettings"?: {
    "model"?: string;        // e.g. "gpt-4o", "claude-3-5-sonnet"
    "temperature"?: number;  // 0–2
    "strategyPreference"?: "AMM_ONLY" | "ORDERBOOK" | "HYBRID";
    "maxSlippage"?: number;  // 0.1–5 (percent)
    "spreadTolerance"?: number; // 0–1
    "openclaw"?: {
      "soul": string;        // max 50_000
      "persona": string;     // max 50_000
      "skill": string;       // max 50_000
      "methodology": string; // max 50_000
      "failed_tests": string;// max 50_000
      "context": string;    // max 50_000
      "constraints": string; // max 50_000
    };
    "tools"?: {
      "internetSearch"?: boolean;
      "newsCrawler"?: boolean;
      "twitter"?: boolean;
      "sportsData"?: boolean;
    };
  };
}
```

- **persona** (top-level): same as `modelSettings.openclaw.persona`; backend can store one or both.
- **modelSettings**: store as JSON; frontend expects it returned on **GET /api/agents/:id** so it can repopulate the form (including `modelSettings.openclaw` and `modelSettings.tools`).

### 3.2 Validation (mirror frontend agentStudioSchema)

- `name`: required on create; 1–120 chars.
- `persona`: max length 50_000.
- `modelSettings.model`: non-empty string if present.
- `modelSettings.temperature`: number in [0, 2] if present.
- `modelSettings.strategyPreference`: enum AMM_ONLY | ORDERBOOK | HYBRID if present.
- `modelSettings.maxSlippage`: number in [0.1, 5] if present.
- `modelSettings.spreadTolerance`: number in [0, 1] if present.
- `modelSettings.openclaw`: each field (soul, persona, skill, methodology, failed_tests, context, constraints) string, max 50_000.

### 3.3 GET /api/agents/:id response

Must include at least:

- `name`, `persona`, `modelSettings` (with `openclaw`, `tools`, `model`, `temperature`, strategy fields as above).
- `strategy`: `{ preference?: string, maxSlippage?: number, spreadTolerance?: number }` (frontend can also read these from modelSettings if preferred).

Frontend derives form state from `modelSettings.openclaw` and, if missing, falls back to default OpenClaw template and `agent.persona` for `openclaw.persona`.

---

## 4. Vault & Funds Settings

**Scope:** User’s USDC balance in the Prediction Vault and deposit/withdraw actions.

### 4.1 Balance (read)

- **GET /api/settings/vault/balance** (or **GET /api/vault/balance**)
  - Returns: `{ balance: string }` (USDC amount as string for precision) or `{ balanceUsdc: number }` if backend uses number.
  - Frontend currently uses a placeholder; it will display this value once the endpoint exists.

### 4.2 Deposit / Withdraw (actions)

Frontend submits:

```ts
// Form payload (validated by vaultSchema)
{
  "amount": string;  // numeric string > 0
  "action": "deposit" | "withdraw";
}
```

- **POST /api/settings/vault/deposit** (or **POST /api/vault/deposit**)
  - Body: `{ amount: string }` (or number; ensure precision for USDC).
  - Returns: success + optional tx reference or updated balance.

- **POST /api/settings/vault/withdraw** (or **POST /api/vault/withdraw**)
  - Body: `{ amount: string }`.
  - Returns: success + optional tx reference or updated balance.

If deposit/withdraw are handled entirely by the smart contract and the backend only tracks state, the backend can still expose these endpoints as triggers or as a record of intent; the report leaves that design to the backend/contract team.

---

## 5. Developer API Settings (Future)

**Scope:** API key management and integration settings.

- Frontend has a placeholder tab only.
- No payload or validation is defined yet.
- Suggested future endpoints: **GET /api/settings/api-keys**, **POST /api/settings/api-keys**, **DELETE /api/settings/api-keys/:id** (or equivalent). No implementation detail required until the feature is specified.

---

## 6. Summary: New or Extended Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| /api/settings/profile | GET | Return username, email, optional globalPnl, totalVolume |
| /api/settings/profile | PATCH | Update username, email |
| /api/agents/:id | PATCH | Already exists; extend to accept modelSettings.openclaw, modelSettings.tools, strategy fields |
| /api/agents/:id | GET | Already exists; ensure modelSettings (incl. openclaw, tools) and strategy are returned |
| /api/settings/vault/balance | GET | Return user’s Prediction Vault USDC balance |
| /api/settings/vault/deposit | POST | Submit deposit (body: amount) |
| /api/settings/vault/withdraw | POST | Submit withdraw (body: amount) |

---

## 7. Frontend files reference

- **Profile:** `src/lib/settings.schema.ts` (profileSchema), `src/components/settings/ProfileTab/ProfileTab.tsx`
- **Agent Studio:** `src/lib/settings.schema.ts` (agentStudioSchema, openclaw), `src/types/openclaw.types.ts`, `src/components/settings/AgentStudioForm/AgentStudioForm.tsx`, `src/types/agent.types.ts` (UpdateAgentBody)
- **Vault:** `src/lib/settings.schema.ts` (vaultSchema), `src/components/settings/VaultTab/VaultTab.tsx`
- **Settings sections:** `src/types/settings.types.ts`

All settings configurations listed above are implemented in the frontend and will be wired to these endpoints once they are available.
