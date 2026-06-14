# AI Usage Log - SplitWise Expense Analyzer

This document details the AI tools utilized, prompts executed, and technical adjustments made during the development of this application.

---

## 1. AI Tools & Prompt Systems

* **AI Coding Companion**: Antigravity (Powered by Google Gemini 3.5 Flash)
* **Design & Spec Generation**: Antigravity Image Generator (for layout architecture designs)
* **Key Prompts Used**:
  * *"Build a full-stack Expense Analyzer web application similar to Splitwise with authentication, group expenses, settlements, and analytics."*
  * *"How to start"* (in response to implementation plan confirmation).
  * *"Project Deliverables (Must Generate)"* (to establish compliance output documents).

---

## 2. AI Mistakes & Technical Fixes

During the development process, we encountered three package compatibility anomalies. Below is a log of the mistakes detected and how they were resolved.

### Mistake 1: Prisma v7 Schema Datasource URL Deprecation
* **Anomaly**: Running migrations with the default setup resulted in a Prisma v7 compile crash (`Error code: P1012`), notifying that `url = env("DATABASE_URL")` is no longer supported directly inside `schema.prisma` without setting up a separate `prisma.config.ts` configuration file.
* **Fix**: Downgraded both `prisma` and `@prisma/client` to stable version `5.22.0` in the `backend/package.json`. This version fully supports inline datasource configurations, restoring SQLite/PostgreSQL environment portability with zero additional configuration overhead.

### Mistake 2: Tailwind CSS v4 PostCSS Compilation Error
* **Anomaly**: Running the production build (`npm run build`) in Vite failed because the default installation pulled Tailwind CSS v4. Tailwind v4 has moved its PostCSS plugin to a separate package (`@tailwindcss/postcss`), which broke our standard `postcss.config.js` and threw a compilation failure.
* **Fix**: Downgraded frontend styling dependencies by explicitly running `npm install -D tailwindcss@3 postcss autoprefixer`. This restored compatibility with the `tailwind.config.js` theme file and allowed the Vite project to build successfully for production.

### Mistake 3: Missing Root Monorepo dev Launch Script
* **Anomaly**: Because the project is structured as a monorepo, executing `npm run dev` in the root folder failed with `ENOENT` since no `package.json` was located in the parent directory, requiring the user to open multiple terminal tabs and navigate manually.
* **Fix**: Created a root-level `package.json`, installed the `concurrently` package in the root workspace, and added a `"dev"` script. This maps `npm run dev` to boot both `npm run dev --prefix backend` and `npm run dev --prefix frontend` concurrently in a single terminal tab.
