# Code Screen Interview Project

A full-stack application for code screen interviews with Node.js/GraphQL backend and React frontend.

## Quick Start

See **[INSTRUCTIONS.md](INSTRUCTIONS.md)** for detailed setup guide.

```bash
make up
```

| Service | URL |
|---------|-----|
| Web App | http://localhost:8280 |
| GraphQL API | http://localhost:3200/v1 |
| Prisma Studio | http://localhost:3201 |

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Node.js 22, Express, GraphQL (type-graphql), Prisma ORM |
| **Frontend** | React 18, Apollo Client, Styled Components, Webpack 5 |
| **Database** | PostgreSQL 14 |
| **Infrastructure** | Docker, Docker Compose |

## Project Structure

```
code-screen-1/
├── server/                # Node.js backend
│   ├── src/
│   │   ├── endpoint/      # GraphQL schema & resolvers
│   │   ├── service/       # Business logic
│   │   └── model/         # Data models
│   └── prisma/            # Database schema & migrations
└── web/                   # React frontend
    └── src/
        ├── pages/         # Page components
        ├── graphql/       # Apollo client & queries
        └── auth/          # Authentication context
```

## API Reference

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthcheck` | Health check |

### GraphQL Endpoint

**`POST /v1`** - GraphQL API (GraphiQL enabled)

#### Queries

```graphql
query {
  healthcheck  # Returns "OK"

  me {         # Get current user (requires auth)
    ok
    user { id email first_name last_name status }
    error
  }

  getPaymentMethods {  # Get user's payment methods (requires auth)
    ok
    payment_methods { id last4 card_network exp_month exp_year default }
    error
  }

  getMembershipStatus {  # Get subscription status (requires auth)
    ok
    membership { status start_date inactive_after amount }
    error
  }
}
```

#### Mutations

```graphql
mutation {
  # Authentication
  login(email: "user@example.com", password: "password") {
    ok
    token
    user { id email }
    error
  }

  signup(email: "user@example.com", password: "password", first_name: "John", last_name: "Doe") {
    ok
    token
    user { id email }
    error
  }

  # Payment Methods
  addCard(card_number: "4111111111111111", exp_month: "12", exp_year: "2028", cvv: "123") {
    ok
    payment_method { id last4 card_network }
    error
  }

  removeCard(payment_method_id: "uuid") {
    ok
    error
  }

  processPayment(payment_method_id: "uuid", amount: 1000) {
    ok
    payment { id status amount }
    error
  }

  # Subscriptions
  startTrial {
    ok
    subscription { id status start_date }
    error
  }

  cancelSubscription(reason: NOT_USING_SERVICE) {
    ok
    error
  }

  restartMembership {
    ok
    subscription { id status }
    error
  }
}
```

## Authentication

JWT-based authentication:

1. Login or signup via GraphQL mutation
2. Server returns JWT token
3. Include token in `auth-token` header for authenticated requests

## Make Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make exec-server` | Shell into server container |
| `make exec-web` | Shell into web container |
| `make test-server` | Run backend tests |
| `make studio` | Open Prisma Studio (local dev) |
| `make migrate` | Run database migrations |
| `make clean` | Clean build artifacts |
