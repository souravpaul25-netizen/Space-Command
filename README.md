# SPACE COMMAND — Junior Astronaut Lunar Outpost Simulator

An interactive, scientifically grounded browser-based lunar outpost engineering simulator built for the **2026 NASA Space Apps Challenge**. Act as Mission Commander of a pressurized research outpost at the Lunar South Pole, balancing life support, power, radiation shielding, hydroponic food production, and robotic rover exploration across a configurable 30-day mission.

The simulator runs **100% locally in the browser** with no backend servers, paid APIs, authentication, or runtime AI calls required.

---

## Key Features

### 1. Five Interconnected Engineering Subsystems
Every engineering decision propagates across the entire outpost in real time using 1-hour simulation timesteps:

| Subsystem | Core Mechanics & Commander Controls |
| :--- | :--- |
| **01. Life Support & Atmosphere (ECLSS)** | Cabin O₂ (kg) & CO₂ (ppm) balance inside a `180 m³` habitat, O₂ electrolysis rate (`Eco` / `Balanced` / `High`), CO₂ amine scrubber toggle & servicing, closed-loop Water Recycler (up to `94%` recovery), emergency O₂ reserve release (`18 kg`), and crew activity presets (`Rest` / `Nominal` / `EVA Prep`). |
| **02. Surface Power & Energy Grid** | Site-specific solar illumination curves, electrostatic solar dust degradation & array cleaning, `120 kWh` battery bank sizing/health servicing, and 4 load-shedding priority presets (`Crew Survival First`, `Balanced Operations`, `Greenhouse Focus`, `Rover Fast-Charge`) that protect P1 life support during eclipses. |
| **03. Radiation Protection & Habitat Safety** | Constant Galactic Cosmic Ray background (`~0.015 mSv/h`) plus incoming Solar Particle Events (`~0.55–0.58 mSv/h`) with 5-hour advance warning and automatic simulation pause. Manage **Regolith Berms**, **Water Wall Bladders** (draining/pumping from habitat potable tanks with `40 L` safety floor), and the **Storm Shelter**. |
| **04. Food Production & Greenhouse** | Three independent hydroponic bays (`Outredgeous Lettuce`, `Cherry Belle Radish`, `Dwarf Soybean`, `Dwarf Lunar Potato`) bridging the ~24.2-day packaged ration limit to Day 30. Control LED lighting (`0–100%`), nutrient modes (`Eco` / `Standard` / `Rich`), calibration, and `55%` transpiration water vapor recovery. |
| **05. Lunar Surface & Exploration Rover** | Interactive HTML5 Canvas terrain map with `12 km` radio horizon, `45 kWh` rover battery, `Direct Traverse` vs. `Safe Crater Detour` routing, core-drill prospecting at 6 South Pole waypoints (including water-ice prospects `PSR Frost Prospect Alpha` & `De Gerlache Ice Trench`), wheel maintenance, and dock charging control. |

### 2. Configurable Lunar Landing Sites & Scenarios
Start with the default **Shackleton Crater Rim** expedition or customize crew size (`2–6`), duration, starting reserves, and site illumination physics:
- **Shackleton Crater Rim (`89.7° S, 129.2° E`)** — ~82% average sunlight with ~36-hour shadow dips every ~9 days.
- **De Gerlache Ridge (`88.5° S, 87.1° W`)** — ~68% average sunlight with deeper 60-hour eclipses.
- **Mare Tranquillitatis (`0.7° N, 23.5° E`)** — Classic 14-day lunar day / 14-day lunar night equatorial reference.

### 3. Mission Handbook, Tutorial & Live Engineering Report
- **12-Chapter Interactive Mission Handbook**: Includes live search across chapters, **10 step-by-step Emergency Checklists**, an **18-term Scientific Glossary**, labelled subsystem diagrams, bookmarking/read-progress tracking, and curated NASA/ESA educational references. Opening the Handbook never interrupts or resets active mission progress.
- **Guided Beginner Tutorial**: 5-step onboarding modal (replayable anytime) with direct screen jumps.
- **Transparent Engineering Report**: Weighted scoring across Survival, Atmosphere, Water/Food, Power, Radiation, and Science/Rover Discovery, paired with a 4-part educational debrief and full **Commander Decision & Rationale Log**.

### 4. Desktop Command Console + Mobile-First Game Interface
- **Desktop (`1024px+`)**: Full mission-control navigation bar, continuous telemetry ribbon, multi-channel Recharts trend charts, and split-pane rover canvas.
- **Smartphones & Tablets (`< 1024px`, Portrait & Landscape)**:
  - Compact **Mobile Game HUD** with progress-bar gauges (`O₂`, `H₂O`, `Food`, `Battery`), clickable critical warning banner, expandable secondary telemetry drawer, and thumb-friendly time controls (`Play/Pause`, `+1h`, `+6h`, `+1d`).
  - Fixed **6-Tab Bottom Dock** (`Overview`, `Air`, `Power`, `Rad`, `Crops`, `Rover`) with live alert indicators and a **Menu Sheet** for Report, Handbook, Tutorial, and New Mission setup.
  - Responsive portrait/landscape **Rover Canvas** with horizontal waypoint selector chips and corner zoom controls.
  - Confirmation modals before destructive or life-critical actions (disabling scrubbers/recyclers, exiting shelter during an SPE, aborting rover sorties, or clearing active crops).

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Charts & Visualization**: Recharts, HTML5 Canvas, Inline SVG
- **Icons & Motion**: Lucide React, Motion (`motion/react`)
- **Testing**: Vitest
- **State Persistence**: Browser `localStorage` (mission state, tutorial completion, handbook progress)

---

## Getting Started

### Prerequisites
- **Node.js** `18+` (recommended `20+` or `22+`)
- **npm** (or `bun` / `pnpm`)

### Installation & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the development server on http://localhost:3000
npm run dev
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite dev server on port `3000` (`0.0.0.0`). |
| `npm run build` | Builds the optimized production bundle into `dist/`. |
| `npm run preview` | Serves the production build locally for testing. |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`). |
| `npx vitest run` | Runs all simulation engine & handbook content unit tests. |

---

## Project Structure

```text
├── index.html                      # Entry HTML with safe-area mobile viewport meta
├── metadata.json                   # Applet title, description & capabilities
├── package.json                    # Scripts and dependencies
├── vite.config.ts                  # Vite + Tailwind v4 configuration
└── src/
    ├── App.tsx                     # Root screen router, HUD/nav wiring & confirmation modals
    ├── index.css                   # Tailwind CSS v4 base, safe-area & touch utilities
    ├── main.tsx                    # React entry point
    ├── components/                 # Shared HUD, navigation, modals, tooltips & telemetry cards
    │   ├── BeginnerTutorialModal.tsx
    │   ├── ConfirmActionModal.tsx
    │   ├── InfoTooltip.tsx
    │   ├── MissionSetupModal.tsx
    │   ├── MobileBottomNav.tsx
    │   ├── MobileGameHUD.tsx
    │   ├── StatusIndicator.tsx
    │   ├── TelemetryMetric.tsx
    │   └── TopNav.tsx
    ├── data/
    │   ├── handbookContent.ts      # Glossary, emergencies, tutorial steps & NASA links
    │   └── handbookContent.test.ts # Handbook data integrity tests
    ├── hooks/
    │   └── useSimulation.ts        # Simulation state hook, timer loop & localStorage sync
    ├── modules/                    # Interactive subsystem views & Rover HTML5 Canvas
    │   ├── agriculture/AgricultureModule.tsx
    │   ├── life-support/LifeSupportModule.tsx
    │   ├── power/SurfacePowerModule.tsx
    │   ├── radiation/RadiationModule.tsx
    │   └── rover/
    │       ├── LunarTerrainCanvas.tsx
    │       └── RoverModule.tsx
    ├── pages/                      # Top-level application views
    │   ├── LunarSurfacePage.tsx
    │   ├── MissionControlPage.tsx
    │   ├── MissionHandbookPage.tsx
    │   ├── MissionReportPage.tsx
    │   └── SubsystemsPage.tsx
    └── simulation/                 # Pure, deterministic aerospace simulation engine
        ├── config.ts               # Site profiles, crop catalog, waypoints & NASA baselines
        ├── engine.ts               # 1-hour timestep state reducer & action handlers
        ├── engine.test.ts          # Unit tests for ECLSS, power, SPE, crops & rover
        ├── events.ts               # Solar Particle Events & outpost alerts
        ├── resources.ts            # Stoichiometric & energy balance helpers
        ├── scoring.ts              # Transparent safety score & educational debrief generator
        ├── time.ts                 # Mission clock formatting helpers
        └── types.ts                # Core TypeScript domain models
```

---

## Scientific Scope & Assumptions

The simulation pairs real NASA mission-architecture principles (such as **HIDH** metabolic O₂/CO₂ rates of `0.84 kg/person/day` and `1.0 kg/person/day`, stoichiometric water electrolysis at `1.125 kg H₂O / kg O₂`, and hydrogen-rich water shielding physics) with simplified, student-accessible models:
- Crop growth windows (`7–14` days) are accelerated for 30-day classroom gameplay, echoing NASA **Veggie** / **Ohalo III** supplemental crop studies.
- Radiation attenuation uses simplified exponential attenuation models rather than flight-certified particle transport codes (`OLTARIS`/`HZETRN`).
- Confirming lunar water-ice with the rover maps **ISRU** prospecting targets only—real cryogenic ice extraction requires separate mining ovens, condensers, and filtration plants.

---

## License

Built for educational outreach and the **2026 NASA Space Apps Challenge**.
