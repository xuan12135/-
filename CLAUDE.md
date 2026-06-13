# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A WeChat Mini Program (微信小程序) named **小梁宝贝的愿望** — a Hello Kitty–themed food/tea ordering app. There is no build step, no `package.json`, and no backend. The project is opened directly in **微信开发者工具 (WeChat Developer Tools)**, which provides the simulator, the JS runtime, the `wx.*` APIs, and preview/upload to WeChat.

Verification commands available from the shell:
- `node -c <path/to/file.js>` — syntax-check a page's JS (the runtime it targets is not Node, but syntax errors will surface here).
- `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8'))"` — validate `app.json` / page `.json` after edits.

There is no test runner and no linter configured.

## Big-picture architecture

### Persistence is the source of truth — and it is `wx.*Storage`, not a server

Every page reads/writes state through `wx.getStorageSync(key)` / `wx.setStorageSync(key, value)` against the device-local storage. The shape of that data is defined once in `app.js#initData()`:

| Key | Shape |
|---|---|
| `products` | Array of `{ id, name, price, sales, rating, category, avatar, specs: string[] }`. Categories in use: `'tea'`, `'food'` (the `'fruit'`/`'interact'` tabs in `index.js` are placeholders with `count: 0`). |
| `orders` | Array of `{ id, productId, productName, price, specs, status, createTime, category }`. `status` cycles `pending → making → done` (see `order.js`). |
| `cart` | Array of `{ productId, productName, price, specs, specKey, quantity, category }`. `specKey = JSON.stringify(specs)` — items with same product but different specs are distinct cart lines. |
| `favorites` | Array of full `product` objects. |
| `points` | Integer; incremented by 1 per item ordered. |

When adding new state: (1) seed a default in `app.js#initData()` with an "if empty" guard, (2) read it via `wx.getStorageSync` on the page's `onShow`, and (3) provide a reset path (the `resetData` action on the Mine page wipes everything and re-runs `app.initData()`).

### Pages and their roles

Pages are listed in `app.json#pages`; the first four are also `tabBar` entries.

- **`pages/index/`** — Catalog + cart. Left sidebar of categories, right-side product list, spec-selection popup, sliding cart popup, checkout. Sales counts shown on products are recomputed from the `orders` array (see `loadProducts`), not stored on the product. **Custom navigation style** (`navigationStyle: "custom"` in `index.json`) — it renders its own banner and computes `statusBarHeight` / `tabBarHeight` from `wx.getWindowInfo()`.
- **`pages/order/`** — Tapping an order cycles its status; advancing to `'done'` increments the matching product's stored `sales`. The status list/map lives in `data.statusList` / `data.statusTextMap`, duplicated in `utils/util.js`.
- **`pages/turntable/`** — Canvas 2D spinning wheel with "吃什么"/"喝什么" tabs. The wheel is drawn imperatively in `drawWheel()`; `spin()` runs an RAF loop with a quartic ease-out and a precomputed total rotation that lands on a chosen index. Because the canvas can't live above the result popup, `showResult()` snapshots it via `canvas.toDataURL()` into `wheelImage` and the WXML swaps to an `<image>` while the popup is open. `addResultToOrder()` finds or synthesizes a `product` and pushes an order directly (bypassing cart).
- **`pages/mine/`** — Profile/stats; the **only** place that wipes storage (`clearAllOrders`, `resetData`). Note `resetData` calls `app.initData()` to reseed defaults.
- **`pages/favorites/`** — Plain list over the `favorites` storage; navigated to via `wx.navigateTo` (not a tab).

### Styling system

- Global theme variables and shared component classes (`.kitty-btn`, `.kitty-btn-outline`, `.kitty-mask`, `.kitty-popup`, `.kitty-avatar`, `.price-tag`, `.stars`) live in **`app.wxss`**. Reuse these instead of re-rolling buttons/popups per page.
- Primary color is `#6A5ACD` (slate blue / Hello Kitty purple) and it appears as a gradient `#9B7FD4 → #6A5ACD` on primary buttons.
- All sizing uses `rpx`. When working with the canvas (turntable), sizes are computed in px from `wx.getWindowInfo()` and multiplied by `pixelRatio` for the canvas backing store, then `ctx.scale(dpr, dpr)` so drawing can use CSS px.

### Shared helpers

- `utils/util.js` — `formatTime`, `formatNumber`, `generateOrderId`, `statusText`, `statusColor`. `generateOrderId()` returns a 4-digit random int (so collisions are possible — current code tolerates this).
- `utils/time.wxs` — WXS variant of `formatTime` for use directly in WXML templates (e.g., `<wxs src="…" />`). WXS cannot use the `util.js` helpers — they are a separate runtime.
- `app.js#generateOrderId()` is duplicated from `util.js`; pages that already hold the `app` reference (index, turntable, mine) call `app.generateOrderId()`, while others use `util.generateOrderId()`.

## Conventions specific to this codebase

- Page files are `.js` / `.json` / `.wxml` / `.wxss` — the four are paired by filename and must stay in sync (a page is registered in `app.json` by directory path).
- The `product.avatar` field stores an emoji-style key (e.g. `'kitty-tea'`) but the UI currently indexes into a `kittyEmojis` array by `item.id % kittyEmojis.length`; don't assume `avatar` is rendered.
- When a new product category is introduced, update both `index.js#data.categories` and ensure `specOptions` in `index.js` covers every entry in the product's `specs[]`.
- Toast and modal accent colors use either `#6A5ACD` (primary) or `#FF6B8B` (pink, destructive confirmations) — match the existing palette.
