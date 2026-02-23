# Tracker layout – recommended DB changes

Summary of schema changes that would support the Tracker page (agent treemap, statistics, markets traded, settings, preferences, thinking, AI requests).

---

## 1. Order – link to user and agent

**Current:** `Order` has only `marketId`. Tracker needs "orders by agent" for the Statistics column.

**Change:** Add optional `userId` and `agentId` to `Order`:

```prisma
model Order {
  id String @id @default(uuid())
  marketId String
  outcomeIndex Int @default(0)
  userId String?      // add
  agentId String?     // add
  side String
  type String @default("LIMIT")
  amount Decimal @db.Decimal(28, 18)
  price Decimal @db.Decimal(28, 18)
  status String @default("PENDING")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  market Market @relation(...)
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)   // add
  agent Agent? @relation(fields: [agentId], references: [id], onDelete: SetNull) // add

  @@index([marketId])
  @@index([marketId, outcomeIndex])
  @@index([userId])    // add
  @@index([agentId])   // add
}
```

Add to **User**: `orders Order[]`  
Add to **Agent**: `orders Order[]`

---

## 2. AiRequest – optional agentId (or separate AgentAiRequest)

**Current:** `AiRequest` has only `userId`. Tracker "AI requests" may be agent-driven.

**Option A – add optional agentId to AiRequest:**

```prisma
model AiRequest {
  id String @id @default(uuid())
  userId String
  agentId String?  // add: when set, request was made by/for this agent
  prompt String
  response String?
  createdAt DateTime @default(now())

  user User @relation(...)
  agent Agent? @relation(fields: [agentId], references: [id], onDelete: SetNull)  // add

  @@index([userId])
  @@index([agentId])  // add
}
```

Add to **Agent**: `aiRequests AiRequest[]`

**Option B:** Keep AiRequest user-only and use **AiLog** with action e.g. `"thinking"` or `"request"` and payload `{ prompt, response }` for agent "thinking" / requests.

---

## 3. Tokens used (LLM usage)

**Current:** No field for "tokens used" per agent.

**Option A – on Agent:**

```prisma
model Agent {
  // ... existing fields
  tokensUsed Int? @default(0)  // optional: total LLM tokens used
  // or
  llmUsage Json?               // e.g. { "prompt": 1200, "completion": 800, "lastUpdated": "..." }
}
```

**Option B – separate table:** `AgentUsage { agentId, date, tokensIn, tokensOut }` for time-series in Statistics.

---

## 4. News / feed items the agent "thought based on"

**Current:** No link between Agent and FeedItem. AiLog can store arbitrary payload.

**Option A – store in AiLog only:** Use action e.g. `"news_consumed"` and payload `{ feedItemIds: string[], summary?: string }`. No schema change; backend writes this when agent uses news.

**Option B – join table:**

```prisma
model AgentFeedItem {
  id String @id @default(uuid())
  agentId String
  feedItemId String
  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  feedItem FeedItem @relation(fields: [feedItemId], references: [id], onDelete: Cascade)

  @@unique([agentId, feedItemId])
  @@index([agentId])
}
```

Add to **Agent**: `agentFeedItems AgentFeedItem[]`  
Add to **FeedItem**: `agentFeedItems AgentFeedItem[]`

---

## 5. Risks

**Current:** No explicit risk model.

**Option A – derived only:** Compute from positions (exposure, concentration) and strategy (slippage, spread) in the API. No schema change.

**Option B – snapshot table:**

```prisma
model AgentRiskSnapshot {
  id String @id @default(uuid())
  agentId String
  date DateTime @db.Date
  score Float?   // 0–1 or similar
  payload Json?  // breakdown: exposure, drawdown, etc.
  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId])
  @@index([date])
}
```

---

## 6. What already exists (no change)

- **Agent**, **AgentStrategy** (preference, maxSlippage, spreadTolerance) – for preferences and strategy stats.
- **AgentTrack** – for PnL/volume/trades time-series (Statistics charts).
- **Trade**, **Position** – for activities and "markets traded" (marketIds from these).
- **AiLog** – for "thinking" and agent actions (payload can hold news refs, reasoning).
- **Activity** – for activity feed by agent.

---

## 7. Suggested order of implementation

1. **Order.userId / Order.agentId** – needed for "orders" in Tracker Statistics.
2. **Tokens used** – Agent.tokensUsed or AgentUsage table if you want charts.
3. **News/feed** – AiLog payload first; add AgentFeedItem only if you need direct queries.
4. **AiRequest.agentId** – only if you want to attribute requests to agents in the UI.
5. **Risk** – derived first; add AgentRiskSnapshot if you need stored history.
