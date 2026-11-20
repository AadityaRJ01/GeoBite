# GeoBite 🗺️✨

> **Bespoke Geospatial Discovery, Algorithmic Route Optimization & Curated Travel Planning Platform**  
> Built with a decoupled monorepo architecture pairing an ultra-fast **React 19 + Vite** client with an enterprise-grade **Node.js Express + PostGIS** engine, following Google Stitch's *Kinfolk & Cartography* design system.

[![Frontend Build](https://img.shields.io/badge/Frontend-Vite%208%20%7C%20React%2019-096a5f?style=for-the-badge&logo=vite)](./frontend)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-318%20Passing-00140f?style=for-the-badge&logo=node.js)](./backend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20PostGIS-336791?style=for-the-badge&logo=postgresql)](./backend/prisma)
[![Routing](https://img.shields.io/badge/Routing-OSRM%20Road%20Network-096a5f?style=for-the-badge&logo=openstreetmap)](http://project-osrm.org/)
[![Design System](https://img.shields.io/badge/Design-Google%20Stitch%20Kinfolk-9eefe0?style=for-the-badge&logo=google)](./design-reference)
[![License](https://img.shields.io/badge/License-MIT-0e2a24?style=for-the-badge)](./LICENSE)

---

## 📸 Application Showcase & Visual Tour

### 1. Editorial Landing Page — Kinfolk & Cartography Aesthetic
*An immersive publication-inspired gateway for gastronomic travelers and flâneurs, pairing literary typography with dynamic geospatial search and sensory taxonomy.*

![GeoBite Hero Section](screenshots/HomePage1.png)

<p align="center">
  <img src="screenshots/HomePage2.png" alt="Sensory Categories & Algorithmic Timeline" width="49%" />
  <img src="screenshots/HomePage3.png" alt="PostGIS Architecture & Platform Specifications" width="49%" />
</p>

---

### 2. Truly Dynamic Global City Discovery & Interactive Maps
*Seamless exploration across any global destination (*San Sebastián, Tokyo, Paris, Mumbai, Bengaluru, Delhi, Kyoto, Copenhagen*). Features dynamic OpenStreetMap/Overpass discovery, PostGIS geospatial bounds filtering, dual-zone place cards, Web Share API, and Google Maps directions.*

<p align="center">
  <img src="screenshots/DiscoveryPage1.png" alt="Discovery Page Split View" width="49%" />
  <img src="screenshots/DiscoveryPage2.png" alt="Interactive Leaflet Viewport Discovery" width="49%" />
</p>

---

### 3. Multi-Stop Itinerary Planner & TSP 2-Opt Route Optimization
*Curate multi-stop walking trails with departure pin re-anchoring, transit intervals, and instant side-by-side algorithmic comparisons (*Manual Baseline vs. Nearest Neighbor vs. 2-Opt Polynomial Local Search*), paired with real OSRM road-following walking polylines.*

<p align="center">
  <img src="screenshots/RoutePlan1.png" alt="Multi-Stop Itinerary Waypoints & Map" width="49%" />
  <img src="screenshots/RoutePlan2.png" alt="Algorithmic Comparison & OSRM Navigation" width="49%" />
</p>

---

### 4. Geospatial Optimization Lab & Benchmark Suite
*Empirical algorithmic laboratory evaluating TSP solvers across 5 standard topographical scenarios (*Small, Medium, Large, Clustered, Dispersed*) with multi-run median execution times, real-time SVG distance columns, scalability latency curves, and CSV telemetry export.*

<p align="center">
  <img src="screenshots/Benchmark1.png" alt="Benchmark Suite Header & 4 KPI Overview" width="49%" />
  <img src="screenshots/Benchmark2.png" alt="Algorithmic Methodologies & 2-Opt Deep Dive" width="49%" />
</p>

<p align="center">
  <img src="screenshots/Benchmark3.png" alt="Real-time SVG Charts: Distance & Latency" width="49%" />
  <img src="screenshots/Benchmark4.png" alt="Empirical Scenario Benchmark Results Table" width="49%" />
</p>

---

### 5. Secure Curator Authentication & Passkey Portal
*Editorial split-card authentication interface with seamless Sign In / Create Account tabs, verified curator indicators, passkey authentication, and fast account switching.*

![GeoBite Login & Authentication Portal](screenshots/LoginPage.png)

---

## 🌟 Key Features & Architectural Innovations

### 🗺️ Truly Dynamic Global City Discovery
- **Universal Discovery**: Search and select **any valid global city** (*Mumbai, Delhi, Tokyo, London, San Sebastián, Kyoto, New York, etc.*) — not limited to pre-seeded destinations.
- **Dynamic Overpass Ingestion**: If a queried city lacks pre-seeded database records, GeoBite automatically geocodes coordinates via OpenStreetMap Nominatim and discovers authentic culinary gems, cafes, and heritage sites via the Overpass API.
- **PostGIS Spatial Indexing**: Viewport-based discovery (`GET /api/places/bounds`) uses PostGIS bounding boxes and spatial indices for sub-10ms bounding queries.
- **Interactive Leaflet Cartography**: Custom dual-ring SVG markers, category filtering (*Pintxos, Cafés, Fine Dining, Scenic Viewpoints*), radius distance sliders, Web Share API (`navigator.share`), and one-click Google Maps turn-by-turn links.

### ⚡ Traveling Salesperson (TSP) 2-Opt Optimization Engine
- **Baseline Naive Order**: Chronological selection order serving as benchmark ground truth ($O(N)$).
- **Nearest Neighbor Heuristic**: Greedy pathbuilder prioritizing proximity ($O(N^2)$).
- **2-Opt Polynomial Local Search**: Iteratively uncrosses intersecting segments by reversing sub-sequences until a 2-optimal cycle is established ($O(K \cdot N^2)$).
- **Guaranteed Invariants**: Strictly enforces non-worsening distances ($\text{Distance}_{\text{2-opt}} \le \text{Distance}_{\text{NN}}$), preserves user-pinned start points, and uses deterministic ID tie-breaking.
- **OSRM Road Network Routing**: Evaluates both Euclidean Haversine distances and real road-following walking polylines and durations via the Open Source Routing Machine (OSRM).

### 📊 Performance Laboratory & Benchmark Suite
- **5 Standard Topography Datasets**:
  - `Small`: 5 stops (Historic Core)
  - `Medium`: 15 stops (Citywide Hubs)
  - `Large`: 40 stops (Greater Scalability Grid)
  - `Clustered`: 12 stops (Dense 600m Micro-Cluster testing crossover resolution)
  - `Dispersed`: 10 stops (Regional Long-Haul Hubs)
- **High-Resolution CPU Telemetry**: Multi-run median filtering ($1, 3, 5, 10, 50$ iterations) measuring microsecond-level V8 execution times.
- **Interactive SVG Data Visualizations**: Pure inline SVG column charts, latency scalability progression curves, and cross-topology matrix comparisons.
- **CSV & JSON Export**: One-click telemetry export for research papers and portfolio demonstrations.

### 🔐 Persistent Curator Accounts & Trip Management
- **Stateless JWT Authorization**: Cryptographically signed tokens (HMAC-SHA256) with sliding-window brute force rate limiting.
- **Bcrypt Password Security**: Cost factor 12 salt rounds; sensitive hashes are permanently stripped from API outputs.
- **Relational Saved Routes**: PostgreSQL models storing JSON stop manifests, algorithms, distances, and travel durations.
- **One-Click Route Restoration**: Opening `/route?savedRouteId=<uuid>` automatically reconstitutes the full multi-stop sequence, recalculates road geometry, and re-renders the map.
- **30-Day Recovery Holding**: Deleted routes are held in an archive drawer for safe, one-click restoration.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (React 19 + Vite 8)"]
        UI["Google Stitch UI (Tailwind CSS)"]
        Map["Leaflet & React-Leaflet"]
        State["Auth Context & Trip State"]
        API_Client["placesApi & authApi (Fetch Client)"]
    end

    subgraph Server ["Backend (Node.js 24 + Express)"]
        Router["Express REST Router"]
        AuthMiddleware["JWT Auth & Rate Limiter"]
        Controller["Controllers (Places, Routes, Auth)"]
        
        subgraph Algorithms ["Optimization Lab"]
            Baseline["Baseline Sequencer O(1)"]
            NN["Nearest Neighbor Heuristic O(N²)"]
            TwoOpt["2-Opt Polynomial Local Search O(K·N²)"]
            Benchmarker["Benchmark Multi-Runner"]
        end
    end

    subgraph Data ["Persistence & External APIs"]
        Postgres[("PostgreSQL + PostGIS")]
        Prisma["Prisma ORM"]
        OSRM["OSRM Walking & Road Engine"]
        Overpass["OpenStreetMap Overpass & Nominatim"]
    end

    UI --> State
    State --> API_Client
    API_Client --> Router
    Router --> AuthMiddleware
    AuthMiddleware --> Controller
    Controller --> Algorithms
    Controller --> Prisma
    Prisma --> Postgres
    Controller --> OSRM
    Controller --> Overpass
    Map -.-> UI
```

---

## 🧮 Algorithmic Complexity & Mathematical Reference

| Algorithm | Time Complexity | Space Complexity | Description | Typical Distance Reduction |
|---|---|---|---|---|
| **Baseline** | $O(N)$ | $O(N)$ | Chronological insertion sequence | $0.0\%$ (Reference Ground Truth) |
| **Nearest Neighbor** | $O(N^2)$ | $O(N)$ | Greedy local step to nearest unvisited node | $25\% - 35\%$ |
| **2-Opt Local Search** | $O(K \cdot N^2)$ | $O(N)$ | Systematically reverses segments $(i, j)$ if $d(i, i+1) + d(j, j+1) > d(i, j) + d(i+1, j+1)$ | **$38\% - 52\%$** (Recommended) |

$$\Delta_{\text{2-opt}} = \left[ \text{dist}(P_i, P_{i+1}) + \text{dist}(P_j, P_{j+1}) \right] - \left[ \text{dist}(P_i, P_j) + \text{dist}(P_{i+1}, P_{j+1}) \right]$$

*When $\Delta_{\text{2-opt}} > 0$, reversing the sub-segment between $i+1$ and $j$ strictly decreases total path length without introducing loops.*

---

## 📁 Repository Structure

```text
GeoBite/
├── frontend/                     # React 19 + Vite client application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # ProtectedRoute guards
│   │   │   ├── discovery/        # InteractiveMap, PlaceCard, PlaceList, DiscoverySubheader
│   │   │   ├── route/            # RouteMap, StopList, AlgorithmCards
│   │   │   ├── Navbar.jsx        # Stitch pill navigation with live API health status
│   │   │   ├── HeroSection.jsx   # Kinfolk editorial hero with global search
│   │   │   └── Footer.jsx        # Forest green responsive footer
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Reactive user session & JWT state
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Publication landing page
│   │   │   ├── DiscoveryPage.jsx # Split-screen dynamic global discovery
│   │   │   ├── RoutePlannerPage.jsx # Multi-stop 2-opt route planner
│   │   │   ├── BenchmarkPage.jsx # Geospatial optimization laboratory
│   │   │   ├── SavedTripsPage.jsx# Field archives & saved itineraries
│   │   │   ├── LoginPage.jsx     # Split-card curator sign-in & registration
│   │   │   └── ProfilePage.jsx   # Account management & saved stats
│   │   ├── services/
│   │   │   ├── placesApi.js      # REST client for places, routes & benchmarks
│   │   │   └── authApi.js        # REST client for authentication & saved trips
│   │   ├── index.css             # Tailwind CSS tokens & typography
│   │   └── tailwind.config.js    # Kinfolk & Cartography color palette
│   └── package.json
│
├── backend/                      # Node.js Express ES Modules REST API
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma ORM schema (Users, Places, SavedRoutes)
│   │   ├── migrations/           # PostGIS migrations & spatial extensions
│   │   └── seed.js               # Sample culinary dataset seeding script
│   ├── src/
│   │   ├── algorithms/
│   │   │   ├── routeOptimizer.js # Baseline, Nearest Neighbor & 2-Opt solvers
│   │   │   └── routeBenchmark.js # Multi-run median benchmark runner
│   │   ├── controllers/          # Places, routes, auth & saved routes controllers
│   │   ├── middleware/           # JWT auth, rate limiting & error handlers
│   │   ├── routes/               # Express route declarations
│   │   ├── services/             # Overpass discovery, OSRM routing, geocoding
│   │   ├── app.js                # Express app configuration & middleware
│   │   └── server.js             # HTTP server bootstrap & graceful shutdown
│   ├── test/                     # 7 complete test suites (318+ tests)
│   │   ├── route_optimizer.test.js
│   │   ├── geospatial_discovery.test.js
│   │   ├── osrm_routing.test.js
│   │   ├── global_city_discovery.test.js
│   │   ├── auth.test.js
│   │   ├── dynamic_city_discovery.test.js
│   │   └── saved_routes.test.js
│   └── package.json
│
├── screenshots/                  # High-resolution application screenshots
├── design-reference/             # Google Stitch design references & tokens
├── package.json                  # Root monorepo orchestration scripts
└── README.md                     # Comprehensive project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, React Router 7, Leaflet, Lucide Icons |
| **Backend** | Node.js 24+, Express 4.21+ (ES Modules), Prisma ORM 5.x |
| **Database & GIS** | PostgreSQL 15+, PostGIS spatial extensions, spatial indexing (`ST_DWithin`, `ST_MakeEnvelope`) |
| **Routing & External APIs** | OSRM (Open Source Routing Machine), OpenStreetMap Overpass API, Nominatim Geocoder |
| **Security** | JWT (HMAC-SHA256), bcryptjs (Cost Factor 12), express-rate-limit, CORS |
| **Typography & Styling** | Playfair Display (Editorial Serif), Plus Jakarta Sans (Grotesque Body), Kinfolk Palette |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on v24.11+)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ with PostGIS extension enabled

---

### 1. Monorepo Quick Start

Install all dependencies across both client and server from the root directory:
```bash
npm run install:all
```

Start both backend and frontend concurrently:
```bash
# Terminal 1: Start Express Backend (Port 5000)
npm run dev:backend

# Terminal 2: Start Vite Client (Port 5173)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2. Independent Setup

#### Backend Setup (`backend/`)
```bash
cd backend

# Create environment configuration
cp .env.example .env

# Configure your PostgreSQL connection string in .env:
# DATABASE_URL="postgresql://user:password@localhost:5432/geobite?schema=public"

# Install dependencies
npm install

# Run database migrations and generate Prisma client
npx prisma migrate deploy
npx prisma generate

# (Optional) Seed initial places
npm run prisma:seed

# Start backend server
npm run dev
```

#### Frontend Setup (`frontend/`)
```bash
cd frontend

# Create environment configuration
cp .env.example .env

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🧪 Verification & Test Suites

The backend features an automated test harness covering **318+ tests across 7 comprehensive test suites**:

```bash
# Run all backend test suites
npm test --prefix backend
```

### Individual Test Suites
```bash
# 1. Route Optimization & 2-Opt Invariants (44 tests)
node backend/test/route_optimizer.test.js

# 2. Geospatial Discovery & PostGIS Bounds (38 tests)
node backend/test/geospatial_discovery.test.js

# 3. OSRM Road Network Routing (24 tests)
node backend/test/osrm_routing.test.js

# 4. Global City Overpass Discovery (37 tests)
node backend/test/global_city_discovery.test.js

# 5. JWT Authentication & User Profiles (44 tests)
node backend/test/auth.test.js

# 6. Dynamic City Discovery Fallbacks (115 tests)
node backend/test/dynamic_city_discovery.test.js

# 7. Saved Routes & Trip History (16 tests)
node backend/test/saved_routes.test.js
```

---

## 🔌 API Reference Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new curator with name, email, password |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile |
| `PUT` | `/api/auth/profile` | Update profile name |
| `POST` | `/api/auth/logout` | Stateless logout acknowledgment |

### Geospatial Discovery (`/api/places`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/places/nearby` | Point-radius discovery with category, rating & price filters |
| `GET` | `/api/places/bounds` | Viewport bounding box query (`minLat, maxLat, minLng, maxLng`) |
| `GET` | `/api/places/discover` | Dynamic Overpass discovery for any global city |
| `GET` | `/api/places/:id` | Retrieve single place details |

### Route Optimization & Benchmarks (`/api/routes`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/routes/optimize` | Multi-stop optimization comparing Baseline, NN, and 2-Opt |
| `POST` | `/api/routes/road-route` | Real OSRM road geometry and travel duration |
| `POST` | `/api/routes/benchmark` | Multi-run CPU benchmarking across 5 standard datasets |

### Saved Routes & History (`/api/saved-routes`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/saved-routes` | List saved itineraries with optional `?city=` filter |
| `POST` | `/api/saved-routes` | Persist an itinerary with waypoints, metrics, and city |
| `GET` | `/api/saved-routes/:id` | Fetch specific saved route (verified ownership) |
| `PUT` | `/api/saved-routes/:id` | Rename an existing saved route |
| `DELETE` | `/api/saved-routes/:id` | Move saved route to archive / trash |

---

## 🎨 Design System: Kinfolk & Cartography

GeoBite uses Google Stitch tokens defined in `frontend/tailwind.config.js`:
- **Surface**: Warm ivory eggshell (`#f3fbf6`)
- **Primary**: Deep primeval forest (`#00140f`)
- **Primary Container**: Forest pine container (`#0e2a24`)
- **Secondary**: Coastal eucalyptus (`#096a5f`)
- **Secondary Container**: Soft tidal teal (`#9eefe0`)
- **Typography**: `Playfair Display` (Headlines & Editorial Serifs) paired with `Plus Jakarta Sans` (Telemetry & Grotesque Body)

---

## 📄 License

This project is licensed under the **MIT License** — feel free to adapt and build upon it.
