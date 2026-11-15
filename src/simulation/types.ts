export type MissionPhase = 'active' | 'completed' | 'failed';

export type SubsystemId =
  | 'life-support'
  | 'power'
  | 'radiation'
  | 'agriculture'
  | 'rover';

export type AppScreen =
  | 'mission-control'
  | 'subsystems'
  | 'lunar-surface'
  | 'mission-report'
  | 'handbook';

export type CrewActivityLevel = 'resting' | 'nominal' | 'high';

export type ElectrolysisMode = 'off' | 'conserve' | 'balanced' | 'boost';

export type CropType = 'lettuce' | 'radish' | 'potato' | 'soybean';

export type LightingLevel = 0 | 50 | 75 | 100;

export type NutrientMode = 'eco' | 'standard' | 'rich';

export type RouteRiskProfile = 'direct' | 'safe';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type LunarSiteId = 'shackleton-rim' | 'de-gerlache' | 'equatorial-ref';

export interface LunarSiteProfile {
  id: LunarSiteId;
  name: string;
  coordinates: string;
  description: string;
  avgIlluminationPct: number;
  eclipseFrequencyLabel: string;
  /** Deterministic illumination fraction [0..1] for a given mission hour */
  getIllumination: (hour: number) => number;
}

export interface CropDefinition {
  id: CropType;
  name: string;
  growthHours: number;
  yieldDryKg: number;
  waterLitresPerHour: number;
  powerKwAtFullLight: number;
  moraleBonus: number;
  description: string;
}

export interface CropBayState {
  bayId: number;
  cropType: CropType | null;
  growthHoursElapsed: number;
  healthPct: number;
  status: 'empty' | 'growing' | 'ready' | 'failed';
  failureReason?: string;
}

export interface RoverWaypoint {
  id: string;
  name: string;
  x: number; // km from habitat (-10 to +10)
  y: number; // km from habitat (-10 to +10)
  elevationM: number;
  terrainDifficulty: number; // 1.0 = flat mare/ridge, 2.2 = rough crater rim
  scienceValue: number;
  hasPotentialWaterIce: boolean;
  hasRegolithDeposit: boolean;
  description: string;
}

export interface CraterObstacle {
  id: string;
  name: string;
  x: number;
  y: number;
  radiusKm: number;
  permanentlyShadowed: boolean;
}

export interface RoverMissionPlan {
  destinationId: string;
  routeProfile: RouteRiskProfile;
  distanceOneWayKm: number;
  estimatedHoursOneWay: number;
  estimatedEnergyOneWayKwh: number;
  estimatedTotalRoundTripKwh: number;
  terrainWearFactor: number;
}

export interface RoverState {
  x: number;
  y: number;
  status: 'docked' | 'en-route-outbound' | 'exploring' | 'en-route-return' | 'stranded';
  batteryKwh: number;
  batteryMaxKwh: number;
  chargingEnabled: boolean;
  mobilityHealthPct: number;
  targetWaypointId: string | null;
  routeProfile: RouteRiskProfile;
  legProgressHours: number;
  legTotalHours: number;
  samplesCollected: number;
  visitedWaypointIds: string[];
  discoveredIceSites: string[];
  discoveredRegolithSites: string[];
  commRangeKm: number;
}

export interface ShieldingState {
  aluminiumKg: number; // Baseline structural habitat shielding
  waterWallLitres: number; // Uses water from outpost inventory when allocated
  regolithBagsKg: number; // Built in-situ via crew/rover effort
  totalMassBudgetKg: number;
  inShelter: boolean;
  regolithBuildProgressHours: number;
}

export interface MissionAlert {
  id: string;
  hour: number;
  subsystem: SubsystemId | 'mission';
  severity: AlertSeverity;
  title: string;
  message: string;
  actionHint: string;
  resolved: boolean;
}

export interface ActiveEvent {
  id: string;
  type:
    | 'solar-particle-event'
    | 'dust-accumulation'
    | 'battery-degradation'
    | 'scrubber-malfunction'
    | 'water-recycler-fouling'
    | 'greenhouse-blight'
    | 'rover-mobility-fault'
    | 'unexpected-power-dip';
  title: string;
  subsystem: SubsystemId;
  startHour: number;
  warningHours: number;
  durationHours: number;
  severity: AlertSeverity;
  active: boolean;
  mitigated: boolean;
  description: string;
}

export interface DecisionLogEntry {
  id: string;
  hour: number;
  subsystem: SubsystemId | 'mission';
  actionTitle: string;
  explanation: string;
}

export interface TelemetrySnapshot {
  hour: number;
  day: number;
  oxygenKg: number;
  co2Ppm: number;
  waterLitres: number;
  foodKg: number;
  batteryKwh: number;
  solarPowerKw: number;
  powerDemandKw: number;
  cumulativeRadiationMsv: number;
  crewHealthPct: number;
}

export interface SubsystemPriorities {
  lifeSupport: number; // 1 = highest
  habitatThermal: number;
  agriculture: number;
  roverDock: number;
}

export interface MissionConfig {
  crewSize: number;
  missionDurationDays: number;
  timestepHours: number;
  siteId: LunarSiteId;
  initialOxygenKg: number;
  maxOxygenKg: number;
  emergencyOxygenReserveKg: number;
  initialWaterLitres: number;
  maxWaterLitres: number;
  initialFoodKg: number;
  solarArrayPeakKw: number;
  batteryCapacityKwh: number;
  initialBatteryKwh: number;
}

export interface SimulationState {
  config: MissionConfig;
  hour: number;
  phase: MissionPhase;
  failureReason: string | null;
  paused: boolean;
  pauseReason: string | null;

  // Crew
  crewHealthPct: number;
  crewMoralePct: number;
  crewActivity: CrewActivityLevel;

  // Module 01: Life Support
  oxygenKg: number;
  emergencyOxygenKg: number;
  emergencyOxygenActive: boolean;
  cabinO2Kpa: number;
  co2Ppm: number;
  electrolysisMode: ElectrolysisMode;
  co2ScrubberEnabled: boolean;
  co2ScrubberHealthPct: number;
  waterLitres: number;
  waterRecyclerEnabled: boolean;
  waterRecyclerHealthPct: number;
  waterRecoveryEfficiencyPct: number;

  // Module 02: Surface Power
  solarIlluminationFactor: number;
  solarGenerationKw: number;
  solarDustLossPct: number;
  batteryKwh: number;
  batteryMaxEffectiveKwh: number;
  batteryHealthPct: number;
  totalPowerDemandKw: number;
  totalPowerSuppliedKw: number;
  powerDeficitKw: number;
  priorities: SubsystemPriorities;
  poweredSubsystems: {
    habitatThermal: boolean;
    lifeSupport: boolean;
    agriculture: boolean;
    roverDock: boolean;
  };
  lastHourBreakdown: {
    habitatKw: number;
    lifeSupportKw: number;
    agricultureKw: number;
    roverDockKw: number;
    conversionLossKw: number;
    netBatteryDeltaKwh: number;
  };

  // Module 03: Radiation Protection
  backgroundRadiationMsvPerHour: number;
  eventRadiationMsvPerHour: number;
  effectiveDoseRateMsvPerHour: number;
  cumulativeRadiationMsv: number;
  shielding: ShieldingState;

  // Module 04: Food & Agriculture
  packagedFoodKg: number;
  greenhouseFoodProducedKg: number;
  greenhouseLighting: LightingLevel;
  greenhouseNutrientMode: NutrientMode;
  greenhouseHealthPct: number;
  cropBays: CropBayState[];

  // Module 05: Rover
  rover: RoverState;

  // Events, Alerts, Logs & Telemetry
  activeEvents: ActiveEvent[];
  alerts: MissionAlert[];
  decisions: DecisionLogEntry[];
  telemetry: TelemetrySnapshot[];
  lastDecisionFeedback: DecisionLogEntry | null;
}

export interface ScoreCategory {
  id: string;
  label: string;
  score: number; // 0..100
  weight: number;
  status: 'nominal' | 'warning' | 'critical';
  summary: string;
}

export interface MissionEvaluation {
  overallScore: number;
  outcomeGrade: 'Mission Success' | 'Marginal Survival' | 'Mission Compromise' | 'Mission Failure';
  crewSurvived: boolean;
  categories: ScoreCategory[];
  debrief: {
    whatHappened: string;
    whyItHappened: string;
    engineeringPrinciple: string;
    whatCouldBeDoneDifferently: string;
  };
}
