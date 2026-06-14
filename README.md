# SplitWise Expense Analyzer

SplitWise Expense Analyzer is a premium full-stack web application for tracking shared expenses, calculating optimal debt settlements, and analyzing monthly spending trends.

---

## 🚀 Live Demo & Deployments

* **Frontend (Vercel)**: `https://expense-analyzer-frontend.vercel.app` (Placeholder - Deploy yours via the deployment guide below!)
* **Backend API (Render)**: `https://expense-analyzer-backend.onrender.com` (Placeholder - Deploy yours via the deployment guide below!)

---

## 🛠️ Tech Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Axios, Recharts (visualizations), Lucide React (icons).
* **Backend**: Node.js, Express.js.
* **Database**: PostgreSQL (configured for production) / SQLite (pre-configured for zero-friction local development) via Prisma ORM.
* **Authentication**: JWT (JSON Web Tokens) with client-side header injection and Server bcrypt password hashing.

---

## ✨ Features

1. **User Authentication**: Secure Sign-up, Login (with password hashing), and Token-based route protection.
2. **Groups Hub**: Create split groups, add group members by email, and manage members.
3. **Expense Splitting**: Log group expenses with support for:
   * **Equal Split**: Splits cost evenly between all selected group members.
   * **Exact Split**: Specify exact amounts for each member.
   * **Percentage Split**: Specify percentage shares (must sum to 100%).
4. **Optimal Settlements**: Dynamic balance calculations + a greedy transaction minimization algorithm that calculates the absolute minimum repayments required to clear group debts.
5. **Analytics Dashboard**: Rich analytics showcasing total spending, Owed vs. Owe stats, monthly spending trends (AreaChart), and category allocation (PieChart).
6. **CSV Expense Import**: Upload expense sheets for a group. The system parses, validates, imports valid rows, and generates an `ImportReport` detailing any failed rows.
7. **Theme Engine**: Complete light mode and sleek dark mode support.

---

## 💻 Local Setup & Installation

### Prerequisites
* **Node.js** (v18+ recommended)
* **npm** (v9+)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/expense-analyzer.git
   cd expense-analyzer
   ```

2. **Install Root and Workspace Dependencies**:
   ```bash
   npm run install:all
   ```

3. **Database Migration (Prisma)**:
   Navigate to the `backend/` directory, set up the SQLite database, and generate the Prisma Client:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   cd ..
   ```

4. **Launch both Servers (Concurrently)**:
   Start the Express backend and Vite frontend simultaneously in a single terminal tab:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-signing-secret-key-change-in-production"
```

*Note: For production, uncomment the PostgreSQL provider inside `backend/prisma/schema.prisma` and update your `DATABASE_URL` with your PostgreSQL server connection string.*

---

## ☁️ Deployment Guide

### 1. Backend Deployment (Render or Railway)
1. Push your code repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Configure the Build and Start commands:
   * **Build Command**: `npm install && npx prisma generate`
   * **Start Command**: `npm start`
6. Add the following **Environment Variables** in the Render settings:
   * `PORT`: `5000`
   * `DATABASE_URL`: *Your hosted PostgreSQL connection string.*
   * `JWT_SECRET`: *A secure random string.*
7. Trigger the deployment.

### 2. Frontend Deployment (Vercel)
1. Go to [Vercel](https://vercel.com) and create a new project.
2. Link your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Vercel will auto-detect Vite settings:
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Click **Deploy**.

---

## 🤖 AI Tools Used
* **Antigravity Coding Assistant** (Gemini 3.5 Flash) - Assisted in full-stack architecture design, routing, state modeling, and database schemas.
* **Antigravity Image Generator** - Mocked up visual layouts and UI cards.
