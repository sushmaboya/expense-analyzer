# Technical Decisions Log - SplitWise Expense Analyzer

This document details the key technical and architectural decisions made during the development of the SplitWise Expense Analyzer web application.

---

## 1. ORM: Prisma ORM vs. Sequelize

* **Decision Made**: Prisma ORM
* **Alternatives Considered**: Sequelize
* **Reasoning**:
  * **Type Safety & Schema Definition**: Prisma's declarative schema definition (`schema.prisma`) is cleaner than Sequelize's JS/TS model definition. It acts as a single source of truth for both the database structure and types.
  * **Developer Experience**: Prisma Client is auto-generated and provides auto-completion out of the box, preventing query syntax errors.
  * **Migrations**: Prisma Migrate tracks database schema evolution in clean SQL files, making database schema deployments and local synchronization extremely simple.

---

## 2. Database: PostgreSQL vs. MySQL

* **Decision Made**: PostgreSQL (configured for production, with SQLite fallback for local development compatibility)
* **Alternatives Considered**: MySQL
* **Reasoning**:
  * **Complex Queries & Aggregations**: PostgreSQL provides superior performance for aggregation queries (essential for monthly trends and group-level contributions).
  * **Relational Integrity**: PostgreSQL is stricter with relational boundaries, ensuring that cascading deletions (e.g., deleting an expense deletes its shares) are handled safely at the engine level.
  * **Local Portability**: During local environment scanning, we detected that no local PostgreSQL server or Docker daemon was running. We chose to use Prisma's SQLite provider for zero-friction local setups, which maps 1:1 with PostgreSQL data structures, allowing an instant production switch by modifying just one line in `schema.prisma`.

---

## 3. Authentication: JWT-based Token Auth vs. Cookie Sessions

* **Decision Made**: JWT (JSON Web Tokens) inside Authorization Headers
* **Alternatives Considered**: Cookie-based Sessions (Express-session)
* **Reasoning**:
  * **Stateless Scaling**: JWTs are stored client-side (in `localStorage`) and decrypted on the server using a secret key. This avoids holding session data in server memory, making the API stateless and ready for serverless production deployments (like Vercel or Render).
  * **CORS Compatibility**: Because the frontend and backend are hosted on separate domains in production, header-based JWT authentication avoids cross-site cookie configuration issues.

---

## 4. Frontend Framework: React + Vite vs. Next.js

* **Decision Made**: React.js + Vite + Tailwind CSS
* **Alternatives Considered**: Next.js (App Router)
* **Reasoning**:
  * **Separation of Concerns**: Vite produces a static Single Page Application (SPA). This allows us to deploy the frontend to free, high-performance static hosting (like Vercel or Netlify) and keep the Node/Express backend completely decoupled.
  * **Build Performance**: Vite's Rolldown-based compiler is incredibly fast, compiling thousands of modules in under 2 seconds compared to Next.js's Webpack/Turbopack overhead for simple dashboard pages.
  * **State Control**: Since the application relies heavily on dynamic forms (exact splits, percentage splits, drag-and-drop file inputs) and visual charts, a client-side SPA with React state is simpler and more responsive than server-component routing.
