# GroceCart

GroceCart is a grocery shopping application with a React/Vite frontend and a Java 21 / Spring Boot 3.3 microservices backend. It is a Spring Boot port of [GroceCart-New](https://github.com/Amansingh9931/GroceCart-New). Docker Compose is the easiest way to run the complete project locally.

## Requirements

For the Docker setup:

- Docker Desktop (or Docker Engine) with Docker Compose v2
- At least 4 GB of memory available to Docker is recommended for building and running the Java services

For development without Docker:

- JDK 21
- Maven 3.9+
- Node.js 22+ and npm
- MongoDB 8 and Redis 7

## Start the complete project with Docker

Run these commands from the repository root.

1. Create the root environment file from the example. On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env -Force
   ```

   On macOS/Linux:

   ```sh
   cp .env.example .env
   ```

2. Edit `.env`. Set `JWT_SECRET` and `INTERNAL_KEY` to long, random values. `ADMIN_EMAIL` and `ADMIN_PASSWORD` configure the admin sign-in credentials. The optional Google OAuth and Cloudinary values are only needed for those integrations.
3. Build and start all services:

   ```sh
   docker compose up --build
   ```

4. Open the application at [http://localhost](http://localhost). The API gateway is also exposed at [http://localhost:8000](http://localhost:8000).

The first build may take several minutes while Docker downloads base images and Maven/npm dependencies. Leave this terminal running to see service logs. Run `docker compose up -d --build` to start in the background; use `docker compose logs -f` to follow logs.

Stop the services with:

```sh
docker compose down
```

This preserves MongoDB and Redis data in named Docker volumes. To permanently remove that data as well, run `docker compose down -v`.

### Environment variables

The root `.env.example` is the source for the Compose environment:

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs and verifies user tokens. Reuse the previous backend's value if existing sessions must remain valid. |
| `INTERNAL_KEY` | Yes | Shared key for trusted service-to-service requests. |
| `ADMIN_EMAIL` | For admin login | Admin sign-in email. |
| `ADMIN_PASSWORD` | For admin login | Admin sign-in password. |
| `JWT_EXPIRES` | No | Token lifetime; defaults to `7d`. |
| `GOOGLE_CLIENT_ID` | No | Google sign-in integration. |
| `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Product image upload integration. |
| `CORS_ORIGIN` | No | Browser origins allowed by the API gateway; defaults to `http://localhost` in Compose. |

Do not commit `.env` or real credentials. The Compose configuration requires `JWT_SECRET` and `INTERNAL_KEY` to be set.

The frontend has a separate template at [`Frontend/.env.example`](Frontend/.env.example). It is used for running the Vite development server, not by the Docker Compose frontend image. `VITE_BACKEND_URL` should be empty when accessing the app through its Docker/Nginx frontend. `VITE_GOOGLE_CLIENT_ID` and `VITE_GEOAPIFY_KEY` enable the corresponding optional frontend integrations.

## Run the frontend and backend separately

Docker Compose is recommended for normal use. This option is for development when you want Vite's hot reload and run Java services from Maven.

### Start MongoDB and Redis

Start MongoDB 8 and Redis 7 locally and make them available at `localhost:27017` and `localhost:6379`. The backend services use separate MongoDB databases on the same MongoDB instance. The product service also requires Redis.

### Start the Java services

Configure the following environment variables for the terminal that runs the services:

- `JWT_SECRET` and `INTERNAL_KEY` (required; use the same values for every service)
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` (for admin sign-in)
- `GOOGLE_CLIENT_ID` and the three `CLOUDINARY_*` values only if using those integrations
- `MONGODB_URI` and `REDIS_URL` only if MongoDB or Redis are not at their localhost defaults

The root `.env` file is not automatically loaded by Maven. For example, in PowerShell set the required values in each service terminal before starting it:

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret"
$env:INTERNAL_KEY = "replace-with-another-long-random-secret"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "change-me"
```

First install the shared `common` module into your local Maven repository:

```powershell
mvn -pl common install -DskipTests
```

Start each service module in its own terminal from the repository root. In each terminal, repeat the environment-variable setup shown above, then run the listed command (without `-am`, which would also try to run the non-application `common` module). Reinstall `common` after changing it. Use these module names and ports:

| Module | Port | Start command |
|---|---:|---|
| `user-service` | 8001 | `mvn -pl user-service spring-boot:run` |
| `product-service` | 8002 | `mvn -pl product-service spring-boot:run` |
| `cart-service` | 8003 | `mvn -pl cart-service spring-boot:run` |
| `address-service` | 8004 | `mvn -pl address-service spring-boot:run` |
| `order-service` | 8005 | `mvn -pl order-service spring-boot:run` |
| `delivery-service` | 8006 | `mvn -pl delivery-service spring-boot:run` |
| `api-gateway` | 8000 | `mvn -pl api-gateway spring-boot:run` |
| `tracking-service` | 9092 | `mvn -pl tracking-service spring-boot:run` |

Start the six HTTP services, tracking service, and gateway. The gateway routes API requests to the other services; tracking handles Socket.IO/WebSocket traffic.

### Start the Vite frontend

In another terminal:

```powershell
Copy-Item Frontend/.env.example Frontend/.env -Force
Set-Location Frontend
npm ci
npm run dev
```

Open the URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)). In `Frontend/.env`, set `VITE_BACKEND_URL=http://localhost:8000` for local development. Set `CORS_ORIGIN=http://localhost:5173` in the API gateway's environment so it accepts the Vite origin. Use `npm run build` to build the frontend or `npm run lint` to run ESLint.

## Services and components

| Component | Responsibility |
|---|---|
| `Frontend/` | React/Vite shopping UI; Docker serves the production build with Nginx. |
| `api-gateway/` | Routes `/api/**` and `/socket.io/**` traffic to backend services. |
| `user-service/` | Authentication, profiles, admin users and statistics. |
| `product-service/` | Product catalogue, product administration, CSV catalogue data, image integration and Redis cache. |
| `cart-service/` | Shopping carts. |
| `address-service/` | Customer addresses. |
| `order-service/` | Orders and admin order operations. |
| `delivery-service/` | Delivery partner workflows and commission. |
| `tracking-service/` | Live tracking over Socket.IO/WebSocket. |
| `common/` | Shared Java code, including JWT utilities, auth helpers and service clients. |
| `mongodb` / `redis` | Data stores started by Docker Compose. Each data service uses its own MongoDB database. |

The gateway is the public backend entry point. Internal service-to-service REST calls use the `X-Internal-Key` header; the gateway removes any such header supplied by an outside client.

## Migrate data from the previous monolith

With the source `grocecart` database available on the local MongoDB instance, run:

```sh
mongosh "mongodb://localhost:27017" scripts/migrate-from-monolith.js
```

The script copies users, products, addresses and orders into their per-service databases and moves user cart data into the cart database. It can be run again safely; it upserts by document ID and does not modify the source database. For MongoDB running elsewhere, replace the connection URI.

## Troubleshooting

- **Compose reports that `JWT_SECRET` or `INTERNAL_KEY` is missing:** ensure the root `.env` exists, is populated from `.env.example`, and contains both values.
- **A service cannot connect to MongoDB or Redis:** wait for the containers to start, check `docker compose ps` and `docker compose logs mongodb redis`, or confirm local services are listening on ports 27017 and 6379.
- **The frontend loads but API requests fail:** use the Compose frontend at `http://localhost` or set `VITE_BACKEND_URL` and gateway `CORS_ORIGIN` as described above. Check `docker compose logs api-gateway`.
- **Google sign-in, image uploads, or map features are unavailable:** configure the related optional OAuth, Cloudinary, or Geoapify credentials. These integrations are not required to start the application.
- **Port already in use:** stop the process using the conflicting port or update the corresponding Compose port mapping.

## Intentional differences from the previous Node backend

- Order claiming uses a single conditional MongoDB update, preventing two partners from accepting the same order.
- `update-status` rejects unknown statuses; add-product and place-order return 400 for missing required fields.
- Catalogue (CSV) items in order screens now get their image too.
- `GET /api/admin/test/create-sample-order` was not ported; it was unused by the UI and inserted fake data.
- Users no longer carry a `cartData` field in API responses; carts are managed by a separate service.
- The cart is cleared best-effort after an order is saved, so a cart-service outage does not fail the order.

## Known limits

- Marking an order delivered and updating partner earnings spans two services without a distributed transaction; failures between the operations need an outbox/saga or retry.
- "One active order per partner" remains a check-then-act operation.
- There is no service discovery, config server or distributed tracing; Docker DNS and environment variables are used instead.
