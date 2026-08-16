# Canteen Ordering System

A full-stack canteen ordering application with live stock tracking, a daily
order cutoff time, per-person daily quantity limits, order cancellation,
and post-order ratings. Built for the AI-Powered QA Automation,
Documentation & Software Engineering internship assessment.

- **Backend**: Spring Boot 3 REST API, JWT authentication, H2 database
- **Frontend**: React — separate Student and Admin experiences
- **Tests**: 23 automated JUnit/MockMvc tests (unit + integration),
  including a real two-thread concurrency test

---

## Project structure

```
canteen-ordering/
├── backend/          Spring Boot API (see backend/README.md for details)
│   ├── src/main/java/com/canteen/
│   │   ├── model/         Entities: User, MenuItem, Order, Rating
│   │   ├── repository/    Spring Data JPA repositories
│   │   ├── service/       Business rules (OrderService, RatingService)
│   │   ├── controller/    REST endpoints
│   │   ├── exception/     Centralized error handling
│   │   └── config/        Security (JWT), data seeding
│   └── src/test/java/com/canteen/
│       ├── unit/          Business-rule tests (Mockito)
│       └── integration/   Full HTTP-stack tests (MockMvc)
└── frontend/         React app (Student + Admin pages)
```

---

## Quick start

### Prerequisites

- Java 21 (JDK)
- Node.js 18+ and npm
- Maven (or use the bundled `./mvnw`)

### 1. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

Starts on **http://localhost:8080**. On first run it seeds sample menu
items automatically. Data persists to `backend/data/canteen.mv.db` between
restarts — delete that file to reset to a clean seeded state.

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

> If your frontend was scaffolded with Create React App instead of Vite,
> use `npm start` instead of `npm run dev`.

Starts on **http://localhost:5173** (Vite default) and talks to the
backend at `http://localhost:8080`.

### 3. Use it

- Open the frontend URL in your browser.
- Register a student account, browse the menu, place an order, cancel it
  within the grace window, or rate a completed order.
- For admin actions (managing menu items and stock), use an admin account
  on the Admin page.

---

## API overview

| Method      | Endpoint                    | Auth         | Purpose                                  |
|-------------|------------------------------|--------------|-------------------------------------------|
| POST        | `/auth/register`             | No           | Create account, returns JWT               |
| POST        | `/auth/login`                | No           | Authenticate, returns JWT                 |
| GET         | `/menu`                      | No           | List menu items with live stock           |
| POST / PUT  | `/menu`                      | Yes (admin)  | Add or update a menu item / stock         |
| POST        | `/orders`                    | Yes          | Place an order                            |
| DELETE      | `/orders/{id}`               | Yes          | Cancel own order within grace window      |
| GET         | `/orders/mine`               | Yes          | Own order history                         |
| POST        | `/ratings`                   | Yes          | Rate a completed order (1–5 stars)        |
| GET         | `/ratings/menu-item/{id}`    | No           | All ratings for a menu item               |

All protected endpoints expect `Authorization: Bearer <token>`.

> **Note:** confirm the admin `/menu` endpoints are actually restricted to
> admin users before relying on this table for a live defense — the core
> `User` entity as originally designed has no `role` field, so this should
> be double-checked against the current code.

---

## Business rules enforced

- **Cutoff time**: orders placed after the configured daily cutoff are
  rejected (409).
- **Stock**: an order can't exceed available stock; concurrent orders for
  the same last unit are safely serialized via JPA optimistic locking
  (`@Version` on `MenuItem`) — exactly one wins, the other gets a 409.
- **Daily per-person limit**: each menu item has a max quantity per person
  per day; exceeding it across multiple orders is rejected.
- **Cancellation window**: orders can only be cancelled within a short
  grace period after placement; cancelling restores stock.
- **Rating rules**: one rating per order, only by the order's owner, and
  only for orders that weren't cancelled.
- **Price integrity**: the client never sends a price — the server always
  computes `totalPrice` from the current `MenuItem` price at order time.

---

## Running the tests

```bash
cd backend
./mvnw test
```

Or in IntelliJ: right-click `src/test/java` → **Run 'All Tests'**.

- `unit/OrderServiceTest` — business rules in isolation, with a fixed
  `Clock` injected so cutoff-time and cancellation-window tests are
  deterministic.
- `integration/OrderControllerIT` — full HTTP-layer tests via MockMvc
  against a real (in-memory, test-only) H2 database, including a
  concurrency test where two threads race for the last unit of stock.

**23 tests total, all passing.** See `backend/docs/` for the full Stage 2
test evidence, including a deliberate red run.

---

## AI tools used

Per the assessment's ground rules, tools used in building this project:

- **Claude** — architecture planning, service-layer design, security
  configuration, test suite design and generation, documentation.
- **ChatGPT** — Stage 3 AI change-loop partner for the order-rating
  feature.

---

## Known limitations

- JWT secret in `application.properties` is a placeholder — should move to
  an environment variable for real deployment.
- Admin authorization on menu-management endpoints should be verified
  (see note in the API table above).
