# FARE RADAR PRO — Airfare Intelligence Dashboard with Explainable Buy–Wait Signal

> **Problem Statement:** PS-025 — Data Science & Predictive Analytics  
> **Positioning:** *"An explainable airfare intelligence dashboard that turns historical fare data into understandable price context."*  
> **Secondary:** *"Instead of simply showing today's ticket price, FareRadar explains where that price stands compared with the route's historical behavior."*  
> **Core Question:** *"Is today's fare cheap, normal, or high compared with this route's own history?"*

---

## 1. Executive Summary & Philosophy

Airlines leverage sophisticated dynamic pricing algorithms that cause airfares to swing wildly day-to-day. Travelers are routinely left guessing whether a ticket quote is a genuine bargain or an inflated peak.

**Fare Radar Pro** shifts the paradigm from speculative guesswork to empirical evidence. Rather than making black-box promises, FareRadar provides deep statistical context:
- **Historical Data:** 120 days of multi-carrier fare data across domestic Indian corridors.
- **Statistical Context:** 30/60/90-day quartiles, weak percentile ranking, and coefficient of variation volatility.
- **Explainable Signal:** Deterministic, rule-traced Buy/Wait recommendation with Tukey's fences outlier detection.
- **Indicative Outlook:** 7-day seasonal trend forecast bounded by an honest 80% uncertainty interval.
- **Cinematic Visualization:** Physics-grounded 3D flight trajectory with real-time HUD telemetry, smooth banking, and signal-linked holding patterns.

### Core Vocabulary & Transparency
- **What this IS:** An explainable historical-context dashboard with a real-time 3D flight experience.
- **What this IS NOT:** A booking platform, live airline scraping bot, guaranteed predictor, or financial advisory tool.
- **Forbidden terms:** *guaranteed, 100% accurate, book now and save, price will definitely fall, AI knows future prices.*
- **Required terms:** *historical signal, indicative forecast, statistical trend, uncertainty, explainable heuristic.*

---

## 2. Full-Stack System Architecture

```
fare-radar-pro/
├── backend/                      # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── main.py               # Lifespan preload, CORS, router aggregation
│   │   ├── config.py             # Pydantic v2 settings & clamps
│   │   ├── schemas.py            # Typed Pydantic v2 request/response models
│   │   ├── routers/
│   │   │   ├── routes.py         # GET /api/routes, /api/airlines
│   │   │   ├── analysis.py       # GET /api/analysis (stats, percentile, signal, charts)
│   │   │   ├── forecast.py       # GET /api/forecast (7-day horizon with 80% interval)
│   │   │   ├── validation.py     # GET /api/validation (zero-leakage backtest)
│   │   │   ├── flight.py         # GET /api/flight-path (200 great-circle waypoints)
│   │   │   └── quality.py        # GET /api/data-quality; POST /api/upload-csv
│   │   ├── core/
│   │   │   ├── data_loader.py    # CSV load, validation, sanitization, quality audit
│   │   │   ├── statistics.py     # 30/60/90 stats, scipy weak percentile, quartiles
│   │   │   ├── volatility.py     # Volatility Index: (std / mean) × 100
│   │   │   ├── trend.py          # Recent 7-day median vs prior 7-day direction
│   │   │   ├── heuristic.py      # Explainable rule engine with rule-trace
│   │   │   ├── forecasting.py    # Prophet + Seasonal-Trend ML regression (80% interval)
│   │   │   ├── validation.py     # Rolling-origin walk-forward backtest (MAE, RMSE, MAPE)
│   │   │   └── geo.py            # Great-circle math, SLERP waypoints, bearing, altitude
│   │   └── data/
│   │       ├── airfare_history.csv  # Clean historical domestic airfare records
│   │       ├── airports.json        # Indian airport hubs (DEL, BLR, BOM, MAA, HYD, CCU, GOI)
│   │       └── generate_data.py     # Seeded realistic synthetic data generator
│   ├── tests/                    # 39 unit & integration tests (pytest)
│   └── requirements.txt
│
├── frontend/                     # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── main.tsx / App.tsx    # App root, QueryClient, navigation & modals
│   │   ├── api/client.ts         # Typed fetch client mirroring backend Pydantic models
│   │   ├── store/useAppStore.ts  # Zustand: route, window, fare, flightPhase, demoMode
│   │   ├── scene/                # 3D Experience (Three.js / React Three Fiber)
│   │   │   ├── GlobeScene.tsx    # India relief plate, canvas, and lighting
│   │   │   ├── Airplane.tsx      # Stylized 3D jet, banking, pitch, contrails, beacons
│   │   │   ├── FlightPath.tsx    # Great-circle arc in air + ground projection line
│   │   │   ├── Clouds.tsx        # Instanced drifting cloud clusters
│   │   │   ├── Sky.tsx           # Procedural time-of-day sky & lighting
│   │   │   ├── AirportMarkers.tsx# Pulsing ground beacons + IATA billboard labels
│   │   │   └── CameraRig.tsx     # Cinematic director: takeoff, cruise, orbit controls
│   │   ├── components/           # UI Dashboard components
│   │   │   ├── Header.tsx        # Brand, reference date badge, theme & demo triggers
│   │   │   ├── Sidebar.tsx       # Route, carrier, window, fare slider, accessibility
│   │   │   ├── FlightHud.tsx     # Live flight HUD (altitude, airspeed, heading, distance)
│   │   │   ├── KpiCard.tsx       # Current fare, median, percentile, volatility, corridor
│   │   │   ├── SignalCard.tsx    # Explainable BUY/WAIT signal, reasons, rule trace
│   │   │   ├── PercentileMeter.tsx # Aviation runway meter with colored zones
│   │   │   ├── DistributionChart.tsx # Historical histogram with current fare marker
│   │   │   ├── FareChart.tsx     # Interactive line chart with rolling median & Q1-Q3
│   │   │   ├── VolatilityPanel.tsx # Turbulence wave, CV formula, 7-day direction
│   │   │   ├── WindowCards.tsx   # 30 vs 60 vs 90 day window comparisons
│   │   │   ├── ForecastChart.tsx # 7-day forecast with 80% band & TODAY divider
│   │   │   ├── ValidationPanel.tsx # Rolling-origin backtest table & naive baseline
│   │   │   ├── DataQualityPanel.tsx# Integrity metrics & sanitization audit
│   │   │   ├── CsvUploadModal.tsx# In-memory CSV upload & schema validator
│   │   │   ├── SpeakerNotesOverlay.tsx # Presentation script overlay for demo
│   │   │   ├── Scene2DFallback.tsx # 2D SVG vector route fallback
│   │   │   └── Disclaimer.tsx    # Disclosure & methodology notices
│   │   ├── demo/DemoDirector.ts  # Scripted 30-second presentation timeline
│   │   ├── hooks/                # useReducedMotion, usePerfTier, useCountUp
│   │   └── styles/index.css      # Tailwind & glassmorphism tokens
│   └── package.json
│
├── docker-compose.yml            # Multi-container orchestration
├── Makefile                      # One-command developer tasks
├── start_dev.bat                 # One-click Windows development runner
└── README.md
```

---

## 3. Dataset & Synthetic Demonstration Disclosure

- **Default File:** `backend/app/data/airfare_history.csv`
- **Columns:** `date, route, origin, destination, airline, fare`
- **Coverage:** 8 high-volume domestic corridors (120 daily records each) + 1 deliberately short route (14 records):
  - `DEL-BLR` (Delhi to Bengaluru, ~1,740 km)
  - `BOM-DEL` (Mumbai to Delhi, ~1,148 km)
  - `MAA-BLR` (Chennai to Bengaluru, ~290 km)
  - `HYD-DEL` (Hyderabad to Delhi, ~1,250 km)
  - `BLR-BOM` (Bengaluru to Mumbai, ~840 km)
  - `DEL-BOM` (Delhi to Mumbai, ~1,148 km)
  - `MAA-DEL` (Chennai to Delhi, ~1,760 km)
  - `CCU-DEL` (Kolkata to Delhi, ~1,310 km)
  - `GOI-BLR` (Goa to Bengaluru, 14 observations — tests "Forecast unavailable" guardrail)
- **Carriers Simulated:** IndiGo (6E), Air India (AI), Vistara (UK), Akasa Air (QP).
- **Generation Logic (`generate_data.py`):**
  - Route-specific baseline fare and natural volatility.
  - Weekly seasonality (Friday and Sunday weekend uplifts of +12% to +15%; Tuesday/Wednesday dips of -5%).
  - Smooth multi-week cyclical macro trends.
  - Occasional calendar demand spikes (+28%) and promo flash sales (-18%).
  - Airline tier pricing offsets (full-service vs low-cost carriers).
- **Disclosure Statement:** *All default records are synthetic demonstration data generated deterministically for academic and hackathon evaluation under PS-025. Not live airline inventory.*

---

## 4. Analytics & Explainable Heuristic Engine

### 4.1 Statistical Core
- **Reference Date:** Always the latest date in the dataset (`max(date)`). Never the client or server system clock.
- **Percentile Calculation:** `scipy.stats.percentileofscore(window_fares, current_fare, kind="weak")`.
  - `0% – 25%`: Relatively Low
  - `25% – 50%`: Below Typical
  - `50% – 75%`: Above Typical
  - `75% – 100%`: High
- **Volatility Index (CV):**
  $$\text{Volatility Index} = \left(\frac{\sigma}{\mu}\right) \times 100$$
  - `< 5%`: Low dispersion (steady route pricing)
  - `5% – 10%`: Moderate dispersion (normal weekend variation)
  - `10% – 20%`: High dispersion (frequent carrier repricing)
  - `> 20%`: Very High dispersion (extreme swings)
- **Recent Direction:**
  $$\Delta\% = \frac{\text{Median}_{t-7..t} - \text{Median}_{t-14..t-7}}{\text{Median}_{t-14..t-7}} \times 100$$
  - Threshold $\pm 2\%$: `Increasing` ($> +2\%$), `Decreasing` ($< -2\%$), `Stable` (within $\pm 2\%$). Stated clearly as descriptive, not predictive.

### 4.2 Explainable Heuristic Rule Matrix
| Rule ID | Condition | Base Signal | Rationale |
| :--- | :--- | :--- | :--- |
| **RULE-1** | Percentile $\le 25\%$ | **BUY NOW** | Fare is in the bottom quartile of historical records. |
| **RULE-2** | $25\% < \text{Percentile} \le 40\%$ | **CONSIDER BUYING** | Fare is below the route's typical median price. |
| **RULE-3** | $40\% < \text{Percentile} \le 60\%$ | **NEUTRAL / MONITOR** | Fare sits within the normal expected corridor. |
| **RULE-4** | $60\% < \text{Percentile} \le 75\%$ | **CONSIDER WAITING** | Fare is elevated above the typical median price. |
| **RULE-5** | Percentile $> 75\%$ | **WAIT / PRICE HIGH** | Fare is in the top quartile of historical prices. |

### 4.3 Deterministic Modifiers & Outlier Detection
- **MODIFIER-1 (Tukey's Fences Upward Anomaly):** If $\text{Current Fare} > Q_3 + 1.5 \times \text{IQR}$, an **Upward Anomaly** flag is raised, advising that fares at this extreme historically soften.
- **MODIFIER-2 (Momentum Warning):** If Direction is `Increasing` and Percentile $< 40\%$, appends note: *"Fare is currently low but recent short-term trend is rising."*
- **MODIFIER-3 (Price Softening):** If Direction is `Decreasing` and Percentile $> 60\%$, appends note: *"Fares are elevated but recent 7-day trajectory has softened."*
- **MODIFIER-4 (Volatility Caution):** If Volatility Index $> 20\%$ (`Very High`), raises caution flag regarding rapid fare swings.

---

## 5. Forecasting & Zero-Leakage Validation

### 5.1 Indicative 7-Day Forecast
- **Model:** Dual-engine architecture supporting Facebook Prophet (when installed) with an automated fallback to Scikit-Learn Seasonal-Trend Ridge Regression with day-of-week one-hot encoding.
- **Uncertainty Envelope:** Formulates an 80% prediction interval based on in-sample residual standard errors ($\pm 1.282 \sigma$).
- **Sample Size Safeguard:** Requires $\ge 30$ daily observations. For short routes (e.g. `GOI-BLR`), returns `available: false` with explanation: *"At least 30 observations are required for an indicative forecast."* Never fabricates.

### 5.2 Rolling-Origin Backtesting (Zero Data Leakage)
To ensure empirical integrity, models are evaluated through walk-forward cross-validation:
- For each fold $k \in \{1, 2, 3, 4\}$, training data is strictly partitioned:
  $$\mathcal{D}_{\text{train}} = \{ (t, y_t) \mid t \le T_{\text{cutoff}} \}$$
  $$\mathcal{D}_{\text{test}} = \{ (t, y_t) \mid T_{\text{cutoff}} < t \le T_{\text{cutoff}} + 7 \}$$
- **Zero Leakage Guarantee:** The model has zero visibility into future test points.
- **Metrics Reported:**
  - **MAE:** Mean Absolute Error (explained in plain currency: *"On average, deviated by ₹X"*).
  - **RMSE:** Root Mean Squared Error (penalizes large outlier misses).
  - **MAPE:** Mean Absolute Percentage Error.
  - **80% Coverage:** Empirical percentage of actual test fares falling within the forecast envelope.
- **Naive Baseline Comparison:** Evaluates model MAE against a naive 7-day rolling median baseline. If the baseline performs better or comparably, it is honestly reported (*"Honesty over flattery"*).

---

## 6. Physics-Grounded 3D Flight Experience

- **Great-Circle Trajectory:** Real airport latitudes and longitudes interpolated via Spherical Linear Interpolation (SLERP) across 200 waypoints.
- **Flight Dynamics:**
  - **Climb & Descent:** Smoothstep altitude curve reaching cruise at 35,000 ft equivalent.
  - **Banking & Roll:** Aircraft rolls dynamically into turns proportional to heading change rate (clamped $\pm 24^\circ$).
  - **Contrail Ribbon:** Dynamic particle trail fading behind turbofan engines.
  - **Navigation Beacons:** Red port, green starboard, and white strobe ($\le 1\text{ Hz}$).
- **Signal-Linked Flight States:**
  - `BUY NOW`: Aircraft lands smoothly at destination gate.
  - `WAIT / PRICE HIGH`: Aircraft enters an orbital racetrack **holding pattern** above destination.
  - `NEUTRAL`: Cruise tracking with parallax drifting clouds.
- **Camera Director (`CameraRig.tsx`):** Smooth damped spring transitions between cinematic shots (Takeoff chase $\to$ Cruise side-track $\to$ Landing approach). Smooth handoff to user mouse OrbitControls with automatic return after idle.
- **2D Vector Fallback:** Clean interactive SVG route map and altitude profile for devices without WebGL or with low performance.

---

## 7. API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/routes` | Returns 8 domestic routes with airport coordinates, distance, and date bounds. |
| `GET` | `/api/airlines` | Returns distinct airline carriers present in dataset. |
| `GET` | `/api/analysis` | Core analytics: 30/60/90 stats, percentile, volatility, direction, heuristic signal. |
| `GET` | `/api/forecast` | 7-day indicative forecast points with 80% lower and upper bounds. |
| `GET` | `/api/validation` | Rolling-origin backtest folds, MAE, coverage, and naive baseline comparison. |
| `GET` | `/api/flight-path` | 200 great-circle waypoints with latitude, longitude, bearing, and altitude. |
| `GET` | `/api/data-quality` | Dataset audit: valid rows, date span, deduplication count, and issue logs. |
| `POST` | `/api/upload-csv` | In-memory schema and data quality validator for user-supplied CSV files. |

---

## 8. Installation & Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (tested on Node 20 & 25)

### One-Command Launch (Windows)
Double-click `start_dev.bat` or run:
```cmd
start_dev.bat
```

### Manual Two-Terminal Launch

**Terminal 1 — Backend (FastAPI :8000):**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Docs available at:* `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend (Vite :5173):**
```bash
cd frontend
npm install
npm run dev
```
*App available at:* `http://localhost:5173`

### Docker Compose
```bash
docker-compose up --build
```

---

## 9. Test Suite Verification

### Backend Tests (pytest)
```bash
# Run 39 comprehensive unit & integration tests
set PYTHONPATH=backend
python -m pytest backend/tests -v
```
**Coverage includes:**
- Percentile calculation and boundary ranking.
- Volatility bands and coefficient of variation formula.
- Recent 7-day direction with $\pm 2\%$ deadband.
- Every branch of the heuristic rule engine and modifier flags.
- **Zero data leakage test** in rolling-origin cross-validation.
- Great-circle distance against real benchmarks (DEL–BLR $\approx$ 1,740 km).
- Insufficient data handling ($<30$ observations returns `available: false`).
- All FastAPI endpoints via `TestClient`.

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test
```
**Coverage includes:**
- Zustand store state transitions.
- Currency sanitization and fare clamping.
- Flight progress bounds and phase updates.
- Performance tier fallbacks.

---

## 10. 60-Second Hackathon Demo Script

- **00:00 – 00:08 (The Hook):**  
  *"Judges, airlines use dynamic pricing to keep travelers guessing. Fare Radar Pro answers one fundamental question: Is today's fare cheap, normal, or high compared to this route's own history?"*
- **00:08 – 00:20 (Statistical Context):**  
  *(Press `D` to launch Demo Mode)*  
  *"Here we track flight DEL to BLR in real-time 3D along its great-circle arc. Today's quote is ₹4,850. Instead of guessing, FareRadar evaluates this price against 60 days of historical data, computing a 42nd percentile rank."*
- **00:20 – 00:35 (Explainable Heuristic):**  
  *"Looking at our Signal Card: it fires 'NEUTRAL / MONITOR'. Why? Because ₹4,850 sits within 2% of the route median of ₹4,920. Notice the Rule Trace expander: every single calculation is deterministic, transparent, and explainable."*
- **00:35 – 00:48 (Honest Forecasting & Zero Leakage):**  
  *"Our 7-day forecast shows upcoming day-of-week seasonality bounded by an honest 80% prediction interval. Furthermore, our validation panel uses rolling-origin backtests with strict zero data leakage, beating a naive median baseline by 9.4%."*
- **00:48 – 01:00 (Signal-Linked Arrival & Conclusion):**  
  *"If a price is high, the 3D aircraft enters a holding pattern above the destination. FareRadar doesn't try to guess the airline's algorithm — it gives travelers historical evidence to understand today's price."*

---

## 11. Limitations & Future Roadmap

### Current Limitations
1. **Historical Context Only:** FareRadar explains relative position against past behavior; unforeseen geopolitical or fuel shocks cannot be captured in historical data.
2. **Synthetic Data Default:** Demonstrates functionality under realistic domestic patterns; real-world deployment requires live GDS or aggregator API integrations.
3. **Short Series Constraint:** Strict guardrail disallows predictive modeling when historical observations fall below 30 days.

### Future Roadmap
- Integration with live open fare APIs and NDC aggregators.
- Carrier-specific fare elasticity modeling.
- Personalized route threshold alerts with email/push notification hooks.
- Seat-class fare tier separation (Economy, Premium Economy, Business).
