# Positions, Order Book, and Broadcast Communications Report

Reference for how positions, order book (bid/ask), and trades trigger Redis/WebSocket broadcasts. Use for frontend real-time integration and backend consistency.

---

## 1. Overview

| Layer | Role |
|-------|------|
| **Redis** | Pub/sub: backend publishes to channels; WebSocket service subscribes and forwards to connected clients. |
| **WebSocket** | Clients connect to `GET /ws`, send `SUBSCRIBE` with a room; server sends events to that room. |
| **Rooms** | `market:{marketId}` = one market's updates; `markets` = list-level (create/delete only). |

Room format: `market:` + market UUID (e.g. `market:1d5c64ea-c561-4e69-888b-3bc84d2f1f07`). Prefix is `ROOM_PREFIX` in `src/config/index.ts` (`"market:"`).

---

## 2. Redis Channels

Defined in `src/config/index.ts`:

| Channel | Purpose | Publisher(s) | Subscriber |
|---------|----------|---------------|-------------|
| `market_updates` | Market-level change notifications (create/update/delete, position, orderbook, stats). | Positions routes, markets routes, agent-markets-internal, order-queue, trades-persistence worker | WebSocket service |
| `order_book_update` | Full order book snapshot after an order is processed. | Order queue (`src/engine/order-queue.ts`) | WebSocket service |
| `trades` | One message per executed trade (matching engine). | Order queue | WebSocket service |
| `ws:broadcast` | Generic broadcast: `{ room, payload }`; used for ad-hoc room broadcasts. | Any (e.g. price-feed for PRICE_UPDATE) | WebSocket service |
| `price_feed` | External price updates (e.g. Binance). | Price-feed service | (Optional subscriber) |

Only the WebSocket service subscribes to `market_updates`, `order_book_update`, and `trades` and maps them to WebSocket events.

---

## 3. Positions and Broadcasts

**Source:** `src/routes/positions.routes.ts`, `src/lib/broadcast-market.ts`.

### 3.1 When position changes trigger a broadcast

| Action | When | Broadcast |
|--------|------|-----------|
| **POST /api/positions** | After `prisma.position.create` | `broadcastMarketUpdate({ marketId: position.marketId, reason: MARKET_UPDATE_REASON.POSITION })` |
| **PATCH /api/positions/:id** | After `prisma.position.update` | Same |
| **DELETE /api/positions/:id** | After position is deleted (if position existed) | Same |

No `volume` is sent for position events; only `marketId` and `reason: "position"`.

### 3.2 Redis payload (market_updates)

```json
{
  "marketId": "<uuid>",
  "reason": "position"
}
```

### 3.3 WebSocket event received by clients

- **Room:** `market:{marketId}` only (not `markets`).
- **Event type:** `MARKET_UPDATED`
- **Payload (MarketUpdatedPayload):**

```ts
{
  marketId: string;
  reason?: "position";
  volume?: string;  // not set for position
}
```

Frontend should refetch `GET /api/markets/:id` and/or `GET /api/positions?marketId=...` to get updated positions and market stats.

---

## 4. Order Book (Bid / Ask) and Broadcasts

**Source:** `src/engine/order-queue.ts`. Runs when an order is processed for a market/outcome (in-memory book, then publish).

### 4.1 When order book broadcasts are sent

After every processed order (same block as matching):

1. Publish **order book snapshot** to Redis `order_book_update`.
2. Publish **market update** to Redis `market_updates` with `reason: "orderbook"`.

### 4.2 Redis: order_book_update

**Payload:**

```ts
{
  marketId: string;
  outcomeIndex: number;
  snapshot: OrderBookSnapshot;
}
```

**OrderBookSnapshot** (`src/types/order-book.ts`):

```ts
{
  marketId: string;
  outcomeIndex: number;
  bids: { price: string; quantity: string; orderCount?: number }[];
  asks: { price: string; quantity: string; orderCount?: number }[];
  timestamp: number;
}
```

### 4.3 Redis: market_updates (orderbook)

```json
{
  "marketId": "<uuid>",
  "reason": "orderbook"
}
```

### 4.4 WebSocket events received by clients

**1) ORDER_BOOK_UPDATE**

- **Room:** `market:{marketId}`
- **Payload:** Same shape as snapshot, with `marketId` and `outcomeIndex` (from `src/services/websocket.service.ts`):

```ts
{
  marketId: string;
  outcomeIndex: number;
  bids: { price: string; quantity: string; orderCount?: number }[];
  asks: { price: string; quantity: string; orderCount?: number }[];
  timestamp: number;
}
```

**2) MARKET_UPDATED**

- **Room:** `market:{marketId}`
- **Payload:** `{ marketId, reason: "orderbook" }` (no `volume`).

One order can also produce **TRADE_EXECUTED** events (see below) and later a **MARKET_UPDATED** with `reason: "stats"` after persistence.

---

## 5. Trades and Broadcasts

**Sources:** `src/engine/order-queue.ts` (immediate), `src/workers/trades-persistence.worker.ts` (after DB + volume update).

### 5.1 When a trade is executed (matching engine)

For each fill, the order queue publishes to Redis **trades**:

**Redis payload (trades):**

```ts
{ trade: ExecutedTrade }
```

**ExecutedTrade** (simplified for broadcast; engine has more fields):

- `marketId`, `outcomeIndex`, `price`, `quantity`, `side` ("BID" | "ASK"), `executedAt` (number ms), optional `userId`, `agentId`.

### 5.2 WebSocket: TRADE_EXECUTED

- **Room:** `market:{marketId}`
- **Event type:** `TRADE_EXECUTED`
- **Payload (TradeExecutedPayload):**

```ts
{
  marketId: string;
  outcomeIndex?: number;
  side: "long" | "short";   // BID -> long, ASK -> short
  size: string;             // quantity
  price: string;
  executedAt: string;       // ISO date from trade.executedAt
  userId?: string;
  agentId?: string;
}
```

### 5.3 After trades are persisted

Trades-persistence worker updates `Market.volume` in the DB, then publishes to **market_updates** for each affected market:

```json
{
  "marketId": "<uuid>",
  "reason": "stats",
  "volume": "<decimal string>"
}
```

Clients in `market:{marketId}` receive **MARKET_UPDATED** with `reason: "stats"` and `volume`, so they can update displayed volume without refetching.

---

## 6. All Broadcast Communications Summary

### 6.1 Who publishes to Redis

| Publisher | Channel | When |
|-----------|---------|------|
| **Positions routes** | `market_updates` | Position create / update / delete |
| **Markets routes** | `market_updates` | Market create / update / delete |
| **Agent-markets-internal** | `market_updates` | Internal market create |
| **Order queue** | `order_book_update` | After each order (new snapshot) |
| **Order queue** | `market_updates` | After each order (`reason: "orderbook"`) |
| **Order queue** | `trades` | Once per executed trade |
| **Trades-persistence worker** | `market_updates` | After persisting trades and updating volume (`reason: "stats"`, with `volume`) |
| **Price-feed service** | `ws:broadcast` (or direct broadcast) | External price updates (PRICE_UPDATE) |

### 6.2 WebSocket events sent to clients

| Event | Room(s) | Trigger |
|-------|---------|---------|
| **MARKET_UPDATED** | `market:{marketId}`; for `created`/`deleted` also `markets` | market_updates (created, updated, deleted, stats, position, orderbook) |
| **ORDER_BOOK_UPDATE** | `market:{marketId}` | order_book_update |
| **TRADE_EXECUTED** | `market:{marketId}` | trades (one per fill) |
| **PRICE_UPDATE** | Room from price-feed (e.g. `market:BTCUSDT`) | Price-feed / ws:broadcast |
| **PING** | Per-socket | Heartbeat |
| **ERROR** | Per-socket | Validation / invalid message |

### 6.3 MARKET_UPDATED reasons

| reason | Meaning |
|--------|--------|
| `created` | New market (POST /api/markets or internal). Also sent to room `markets`. |
| `updated` | Market record changed (PATCH /api/markets/:id). |
| `deleted` | Market removed. Also sent to room `markets`. |
| `stats` | Trades persisted; market volume updated. Payload includes `volume`. |
| `position` | Position created, updated, or deleted for this market. |
| `orderbook` | Order processed; order book (and possibly trades) changed. |

---

## 7. Client Messages (Client -> Server)

| Message type | Payload | Purpose |
|--------------|---------|---------|
| **SUBSCRIBE** | `{ room: string }` | Join room. Rooms: `market:{marketId}` or `markets`. |
| **UNSUBSCRIBE** | `{ room: string }` | Leave room. |
| **PONG** | (none or empty payload) | Reply to server PING to keep connection alive. |

**Example subscribe:**

```json
{ "type": "SUBSCRIBE", "payload": { "room": "market:1d5c64ea-c561-4e69-888b-3bc84d2f1f07" } }
{ "type": "SUBSCRIBE", "payload": { "room": "markets" } }
```

---

## 8. All Server Events (Server -> Client)

| Event | Payload | Room | Frontend action |
|-------|---------|------|-----------------|
| **MARKET_UPDATED** | `{ marketId, reason?, volume? }` | `market:{marketId}` or `markets` (created/deleted) | Refetch market/positions or merge volume; on deleted remove or redirect. |
| **ORDER_BOOK_UPDATE** | `{ marketId, bids, asks, timestamp }` (+ optional outcomeIndex) | `market:{marketId}` | Replace/patch local order book. |
| **TRADE_EXECUTED** | `{ marketId, side, size, price, executedAt, userId?, agentId? }` | `market:{marketId}` | Append to trades list / update last trade. |
| **PRICE_UPDATE** | (symbol, price, source; format TBD) | Per price-feed room | Update external price display. |
| **PING** | (optional payload) | Per-socket | Send PONG. |
| **ERROR** | `{ code, message }` | Per-socket | Show error; optionally reconnect. |

---

## 9. End-to-End Flow Examples

### 9.1 User creates a position

1. **POST /api/positions** -> DB create.
2. **broadcastMarketUpdate({ marketId, reason: "position" })** -> Redis `market_updates`.
3. WebSocket service receives message -> sends **MARKET_UPDATED** to room `market:{marketId}`.
4. Subscribed clients get `{ type: "MARKET_UPDATED", payload: { marketId, reason: "position" } }` and can refetch market/positions.

### 9.2 User submits an order (bid/ask)

1. Order queue processes order -> matching engine updates in-memory book and produces trades.
2. Publish to **order_book_update** (full snapshot) -> WebSocket sends **ORDER_BOOK_UPDATE** to `market:{marketId}`.
3. Publish to **market_updates** with `reason: "orderbook"` -> WebSocket sends **MARKET_UPDATED** to `market:{marketId}`.
4. For each fill: publish to **trades** -> WebSocket sends **TRADE_EXECUTED** to `market:{marketId}`.
5. Trades enqueued for persistence; worker updates DB and market volume, then publishes to **market_updates** with `reason: "stats"` and `volume` -> WebSocket sends **MARKET_UPDATED** with volume to `market:{marketId}`.

### 9.3 Client subscription

- Client connects to **GET /ws**.
- Client sends: `{ "type": "SUBSCRIBE", "payload": { "room": "market:<marketId>" } }`.
- Client receives all **MARKET_UPDATED**, **ORDER_BOOK_UPDATE**, and **TRADE_EXECUTED** for that market.

---

## 10. What is not broadcast

- **News / FeedItem:** Creating or updating `News` or `FeedItem` does not publish to any Redis channel or send any WebSocket event. Real-time news would require a new channel/event and publish calls where news or feed items are written.
- **Agents / Users / Templates / etc.:** No broadcast; REST only.

---

## 11. Code References

| Concern | File(s) |
|--------|---------|
| Redis channel names | `src/config/index.ts` (`REDIS_CHANNELS`, `ROOM_PREFIX`) |
| Broadcast helper | `src/lib/broadcast-market.ts` (`broadcastMarketUpdate`, `MARKET_UPDATE_REASON`) |
| Position broadcasts | `src/routes/positions.routes.ts` (create/patch/delete) |
| Order book + trade publishes | `src/engine/order-queue.ts` (`processOne`) |
| Stats/volume broadcast | `src/workers/trades-persistence.worker.ts` |
| Redis -> WebSocket | `src/services/websocket.service.ts` (subscribe to channels, map to events) |
| WebSocket event types/payloads | `src/types/websocket-events.ts` |
| Order book snapshot type | `src/types/order-book.ts` (`OrderBookSnapshot`, `ExecutedTrade`) |
| Frontend WS types | `src/lib/websocket/websocket-types.ts` (MarketUpdatedPayload, OrderBookUpdatePayload, TradeExecutedPayload, WsInboundMessageType) |
| Frontend WS hook | `src/lib/websocket/useMarketSocket.ts` (SUBSCRIBE/UNSUBSCRIBE, ORDER_BOOK_UPDATE, TRADE_EXECUTED, MARKET_UPDATED) |
| Frontend WS guide | `md/websocket.integration.md` |
