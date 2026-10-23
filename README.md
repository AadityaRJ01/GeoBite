# GeoBite 🗺️✨

> **Production-Quality Geospatial Local Discovery & Route Optimization Platform**  
> Engineered as an industry-standard full-stack platform for engineering placement and technical portfolios.

---

## 🧭 Overview

**GeoBite** is a modern geospatial discovery platform designed to find authentic culinary gems, specialty coffee roasters, cultural landmarks, and scenic viewpoints without redundant travel backtracks. Built with a decoupled monorepo architecture, GeoBite pairs a lightning-fast React + Vite frontend with an Express ES Modules backend.

### Day 1 Foundation Deliverables Completed
- [x] Clean, decoupled monorepo structure with strict `frontend/` and `backend/` naming.
- [x] **Frontend:** React + Vite, Tailwind CSS with custom forest & teal palette, React Router, Lucide icons.
- [x] **Landing Page:** Interactive hero with location search, curated category cards, interactive vector map preview placeholder, and responsive modern navigation/footer.
- [x] **Backend:** Node.js Express ES modules, CORS, dotenv, centralized error handler, JSON 404 router.
- [x] **Diagnostics:** `GET /api/health` verified with live health status indicator in the UI.
- [x] **Verification:** Production build verified, backend health endpoint verified, interactive end-to-end browser testing verified.

---

## 📁 Repository Structure

```text
GeoBite/
├── frontend/                     # React + Vite client application
│   ├── public/
│   │   └── favicon.svg           # Custom GeoBite vector branding
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar with live API health status
│   │   │   ├── HeroSection.jsx   # Hero search, radius filters & destination presets
│   │   │   ├── CategorySection.jsx # Curated cards (Food, Cafés, Culture, Viewpoints)
│   │   │   ├── MapPreviewPlaceholder.jsx # Route mockup with waypoint sequencer
│   │   │   ├── ArchitectureSection.jsx # Full-stack architecture & diagnostics
│   │   │   └── Footer.jsx        # Modern responsive platform footer
│   │   ├── pages/
│   │   │   └── LandingPage.jsx   # Root landing page composition
│   │   ├── App.jsx               # React Router wrapper
│   │   ├── index.css             # Tailwind CSS & design tokens
│   │   └── main.jsx              # React DOM entry point
│   ├── .env.example              # Frontend environment reference
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                      # Node.js + Express ES Modules API
│   ├── src/
│   │   ├── routes/
│   │   │   └── health.routes.js  # GET /api/health route handler
│   │   ├── app.js                # Express app, middleware, 404 & error handlers
│   │   └── server.js             # HTTP server bootstrap & graceful shutdown
│   ├── .env.example              # Backend environment reference
│   └── package.json
│
├── .env.example                  # Root environment reference
├── .gitignore                    # Git ignore rules for dependencies & secrets
├── package.json                  # Root monorepo orchestration scripts
└── README.md                     # Project documentation & setup guide
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, React Router, Lucide React Icons |
| **Backend** | Node.js (v24+), Express (v4.21+), ES Modules (`import`/`export`), CORS, Dotenv |
| **Tooling** | Nodemon, PostCSS, Autoprefixer |
| **Design Language** | Forest Green (`#1b3b30`), Vivid Teal (`#14b8a6`), Warm Sand (`#fbfbf9`), Soft Card Elevations |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended, verified on v24.11)
- **npm** (v9.0.0 or higher, verified on v11.6)

### Option A: Monorepo Root Scripts (Quick Start)

Install all dependencies in one command from the project root:
```bash
npm run install:all
```

Start both services in separate terminal windows:

**Terminal 1 (Backend):**
```bash
npm run dev:backend
# Starts Express server on http://localhost:5000 with nodemon
```

**Terminal 2 (Frontend):**
```bash
npm run dev:frontend
# Starts Vite dev server on http://localhost:5173
```

---

### Option B: Running Independently

`frontend/` and `backend/` are strictly decoupled and can be run completely independently.

#### 1. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start in development mode (with hot reloading via nodemon)
npm run dev

# Or start in production mode
npm start
```
The backend server starts at: `http://localhost:5000`

#### 2. Frontend Setup

```bash
cd frontend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build

# Preview production build
npm run preview
```
The frontend application opens at: `http://localhost:5173`

---

## 🔌 API Endpoints & Health Diagnostics

### 1. Health Status
- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Description:** Verifies service health, uptime, and environment.

**Example Response (`200 OK`):**
```json
{
  "success": true,
  "service": "GeoBite API",
  "status": "healthy",
  "timestamp": "2026-10-23T17:24:15.636Z",
  "uptime": 54.66,
  "environment": "development"
}
```

### 2. Unknown Route Handling (404)
- **Method:** `ANY`
- **Endpoint:** `/api/non-existent-route`

**Example Response (`404 Not Found`):**
```json
{
  "success": false,
  "error": {
    "message": "Cannot GET /api/non-existent-route",
    "statusCode": 404
  }
}
```

### 3. Centralized Error Handling (500)
All uncaught application errors are intercepted by centralized middleware in `backend/src/app.js` and returned with structured JSON envelopes:
```json
{
  "success": false,
  "error": {
    "message": "Internal Server Error",
    "statusCode": 500
  }
}
```

---

## ⚙️ Environment Variables

### Root / Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for frontend |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the GeoBite Express backend |

---

## 🗺️ Architectural Roadmap

- **Day 1 (Completed):** Monorepo foundation, responsive landing page, Express ES modules API, health checks, centralized error handling.
- **Day 2 (Planned):** Geospatial database integration (PostGIS / spatial indexing), MapLibre/Leaflet vector tiles, and point-in-radius queries.
- **Day 3 (Planned):** Traveling Salesperson (TSP) heuristic multi-stop route sequencing and elevation contour profiling.
- **Day 4 (Planned):** Spatial cache layer, performance benchmarking, and production deployment configuration.
