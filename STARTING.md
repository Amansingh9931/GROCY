# Starting GroceCart

This is the fastest way to run GroceCart locally. It starts the React frontend, API gateway, eight Spring Boot services, MongoDB, and Redis with Docker Compose.

## Before you begin

Install Docker Desktop and make sure it is running. Allocate at least 4 GB of memory to Docker for a smoother first build.

## 1. Create your local configuration

From the repository root, copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace these placeholder values with long, random secrets:

```dotenv
JWT_SECRET=replace_with_a_long_random_secret
INTERNAL_KEY=replace_with_another_long_random_secret
```

Also set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to the credentials you want to use for the admin account. The Google and Cloudinary values are optional and are not needed to start the app.

> Do not commit `.env`; it can contain credentials.

## 2. Start the project

```powershell
docker compose up --build
```

The initial build can take a few minutes because Docker downloads images and installs Java and frontend dependencies. Keep the terminal open to view logs.

When all services are ready, open:

- Application: http://localhost
- API gateway: http://localhost:8000

To run in the background instead:

```powershell
docker compose up -d --build
docker compose logs -f
```

## 3. Stop the project

```powershell
docker compose down
```

This keeps MongoDB and Redis data. To remove those local Docker volumes too:

```powershell
docker compose down -v
```

## Common issues

- **Missing secret error:** verify `.env` exists in the repository root and both `JWT_SECRET` and `INTERNAL_KEY` have non-placeholder values.
- **Port conflict:** the frontend uses port 80 and the gateway uses port 8000. Stop the process using the conflicting port, or change the matching mapping in `docker-compose.yml`.
- **A service cannot start:** inspect its output with `docker compose logs <service-name>`; for example, `docker compose logs api-gateway`.
- **Frontend opens but requests fail:** confirm the API gateway is running with `docker compose ps`, then check its logs.

## Developing without Docker

For Vite hot reload and independently run services, see the **Run the frontend and backend separately** section in [README.md](README.md). It lists the required JDK, Node.js, MongoDB, Redis, environment variables, service commands, and ports.
