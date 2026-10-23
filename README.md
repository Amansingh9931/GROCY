# GroceCart: Spring Boot microservices

A port of the Node/Express backend of [GroceCart-New](https://github.com/Amansingh9931/GroceCart-New) to
Spring Boot 3.3 / Java 21 microservices. **The `Frontend/` folder is a byte-identical copy of the original**:
same UI, same features, same API URLs and response shapes.

```
 Browser ── nginx (Frontend) ──► api-gateway :8000 ──┬─► user-service     :8001  (auth, profile, admin users)
                                  (alias "backend")  ├─► product-service  :8002  (catalogue, CSV, Cloudinary, Redis)
                                                     ├─► cart-service     :8003
                                                     ├─► address-service  :8004
                                                     ├─► order-service    :8005  (orders + atomic state transitions)
                                                     ├─► delivery-service :8006  (partner flows, commission)
                                                     └─► tracking-service :9092  (Socket.IO live location, via ws)
```

| Service | Owns (own Mongo DB) | Public routes |
|---|---|---|
| user-service | `grocecart_users` | `/api/user/*`, `/api/admin/stats`, `/api/admin/users/*`, `/api/admin/user/*` |
| product-service | `grocecart_products` + Redis cache | `/api/products/*`, `/api/admin/products/*` |
| cart-service | `grocecart_carts` | `/api/cart/*` |
| address-service | `grocecart_addresses` | `/api/address/*` |
| order-service | `grocecart_orders` | `/api/order/*`, `/api/admin/orders/*`, `/api/admin/debug/orders` |
| delivery-service | none (orchestrates) | `/api/delivery/*` |
| tracking-service | none | `/socket.io/*` |

Cross-service data (addresses, customer names, product images, cart clearing, earnings) goes over
`/internal/**` REST calls protected by the `X-Internal-Key` header. The gateway never routes `/internal`
and strips that header from incoming requests. Shared code (JWT, auth guards with the original error
messages, clients, order enrichment) lives in the `common` module.

## Run

```bash
cp .env.example .env        # fill in secrets (reuse the old JWT_SECRET to keep logins valid)
docker compose up --build   # UI on http://localhost, gateway on :8000
```

Existing data: `mongosh "mongodb://localhost:27017" scripts/migrate-from-monolith.js`
(copies the old `grocecart` DB into the per-service DBs; carts move out of the user document).
Passwords (bcrypt) and JWTs (HS256, `{id, role}`) are format-compatible with the old backend.

Local dev without Docker: start Mongo (+ optional Redis), export `JWT_SECRET`, run each module with
`mvn -pl <module> spring-boot:run`; defaults point at `localhost:800x`. Use `VITE_BACKEND_URL=http://localhost:8000`.

## Intentional differences from the Node backend

- **Order claim is atomic** (single conditional Mongo update), so two partners can no longer accept the same order.
- `update-status` rejects unknown statuses; add-product/place-order return 400 for missing required fields (Node returned a Mongoose 500).
- Catalogue (CSV) items in order screens now get their image too (Node only resolved DB products).
- `GET /api/admin/test/create-sample-order` was **not ported** (unused by the UI; it inserted fake data).
- Users no longer carry a `cartData` field in API responses (carts are a separate service).
- Cart is cleared best-effort after an order is saved; a cart-service outage will not fail the order.

## Known limits / next steps

- `mark-delivered` updates the order, then the partner's earnings: two services, no distributed transaction. A failure between the two needs an outbox/saga or retry.
- "One active order per partner" is still check-then-act (as in Node).
- No service discovery/config server/tracing: Docker DNS + env vars keep it simple. Eureka/Config/Micrometer are the natural additions.
