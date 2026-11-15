import {
  CROP_CATALOG,
  LUNAR_CRATERS,
  ROVER_WAYPOINTS,
  SCIENTIFIC_ASSUMPTIONS,
} from './config';
import type {
  CrewActivityLevel,
  ElectrolysisMode,
  NutrientMode,
  RoverMissionPlan,
  RouteRiskProfile,
  ShieldingState,
  SimulationState,
} from './types';

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function getActivityMultiplier(activity: CrewActivityLevel): number {
  switch (activity) {
    case 'resting':
      return 0.85;
    case 'nominal':
      return 1.0;
    case 'high':
      return 1.28;
  }
}

export function getElectrolysisTargetKgPerHour(mode: ElectrolysisMode): number {
  switch (mode) {
    case 'off':
      return 0;
    case 'conserve':
      return 0.08;
    case 'balanced':
      return 0.145; // Matches ~0.14 kg/h consumption of 4 nominal astronauts
    case 'boost':
      return 0.24;
  }
}

export function getNutrientFactor(mode: NutrientMode): {
  growthMultiplier: number;
  waterMultiplier: number;
} {
  switch (mode) {
    case 'eco':
      return { growthMultiplier: 0.78, waterMultiplier: 0.82 };
    case 'standard':
      return { growthMultiplier: 1.0, waterMultiplier: 1.0 };
    case 'rich':
      return { growthMultiplier: 1.18, waterMultiplier: 1.15 };
  }
}

/**
 * Simplified educational radiation attenuation model.
 * Computes transmission factor [0.04 .. 1.0] from areal density of Al, H2O, and Lunar Regolith.
 * Hydrogen-rich water has higher attenuation per kg/m2 than aluminium or regolith.
 */
export function computeShieldingTransmission(shielding: ShieldingState): {
  transmissionFactor: number;
  protectionPct: number;
  arealDensityGcm2: number;
} {
  // Effective habitat shell area ~ 140 m^2 = 1,400,000 cm^2
  const areaCm2 = 1_400_000;
  const alGcm2 = (shielding.aluminiumKg * 1000) / areaCm2;
  const waterGcm2 = (shielding.waterWallLitres * 1000) / areaCm2;
  const regolithGcm2 = (shielding.regolithBagsKg * 1000) / areaCm2;

  const totalGcm2 = alGcm2 + waterGcm2 + regolithGcm2;

  // Exponential educational attenuation curve (not a particle-transport solver)
  const muTotal = alGcm2 * 0.032 + waterGcm2 * 0.062 + regolithGcm2 * 0.038;
  let transmission = Math.exp(-muTotal);

  if (shielding.inShelter) {
    transmission *= 0.18; // Storm shelter provides 82% additional attenuation
  }

  transmission = clamp(transmission, 0.04, 1.0);
  return {
    transmissionFactor: Number(transmission.toFixed(3)),
    protectionPct: Number(((1 - transmission) * 100).toFixed(1)),
    arealDensityGcm2: Number(totalGcm2.toFixed(2)),
  };
}

/**
 * Computes hourly power demand for each subsystem given current state and user settings.
 */
export function computeSubsystemPowerDemands(state: SimulationState): {
  habitatThermalKw: number;
  lifeSupportKw: number;
  agricultureKw: number;
  roverDockKw: number;
  totalDemandKw: number;
} {
  // Habitat base load increases slightly during shelter operations or extreme shadow cold
  const coldPenaltyKw = state.solarIlluminationFactor < 0.2 ? 0.8 : 0;
  const shelterPowerKw = state.shielding.inShelter ? 0.5 : 0;
  const habitatThermalKw = round2(
    SCIENTIFIC_ASSUMPTIONS.power.baseHabitatKw + coldPenaltyKw + shelterPowerKw
  );

  // Life support load: scrubber + water recycler + electrolysis
  const scrubberKw = state.co2ScrubberEnabled
    ? SCIENTIFIC_ASSUMPTIONS.power.scrubberPowerKw
    : 0;
  const recyclerKw = state.waterRecyclerEnabled
    ? SCIENTIFIC_ASSUMPTIONS.power.waterRecyclerPowerKw
    : 0;
  const targetO2Kg = getElectrolysisTargetKgPerHour(state.electrolysisMode);
  const electrolysisKw = targetO2Kg * SCIENTIFIC_ASSUMPTIONS.lifeSupport.electrolysisKwhPerKgO2;
  const lifeSupportKw = round2(scrubberKw + recyclerKw + electrolysisKw);

  // Greenhouse load: sum of active growing bays scaled by lighting level
  const lightFraction = state.greenhouseLighting / 100;
  let agricultureKw = 0;
  for (const bay of state.cropBays) {
    if (bay.cropType && bay.status === 'growing') {
      const crop = CROP_CATALOG[bay.cropType];
      agricultureKw += crop.powerKwAtFullLight * lightFraction;
    }
  }
  agricultureKw = round2(agricultureKw);

  // Rover charging dock load
  const roverNeedsCharge =
    state.rover.status === 'docked' &&
    state.rover.chargingEnabled &&
    state.rover.batteryKwh < state.rover.batteryMaxKwh - 0.05;
  const roverDockKw = roverNeedsCharge
    ? SCIENTIFIC_ASSUMPTIONS.power.roverDockChargeKw
    : 0;

  const totalDemandKw = round2(
    habitatThermalKw + lifeSupportKw + agricultureKw + roverDockKw
  );

  return {
    habitatThermalKw,
    lifeSupportKw,
    agricultureKw,
    roverDockKw,
    totalDemandKw,
  };
}

/**
 * Checks whether a straight segment from (x1, y1) to (x2, y2) intersects any lunar crater obstacle.
 */
export function segmentIntersectsCrater(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string[] {
  const intersected: string[] = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return intersected;

  for (const crater of LUNAR_CRATERS) {
    const t = clamp(((crater.x - x1) * dx + (crater.y - y1) * dy) / lenSq, 0, 1);
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    const dist = Math.hypot(crater.x - closestX, crater.y - closestY);
    if (dist < crater.radiusKm * 0.92) {
      intersected.push(crater.name);
    }
  }
  return intersected;
}

/**
 * Computes distance, time, energy, and wear metrics for a planned rover sortie.
 */
export function calculateRoverMissionPlan(
  destinationId: string,
  routeProfile: RouteRiskProfile,
  fromX = 0,
  fromY = 0
): RoverMissionPlan | null {
  const wp = ROVER_WAYPOINTS.find((w) => w.id === destinationId);
  if (!wp) return null;

  const straightDistKm = Math.hypot(wp.x - fromX, wp.y - fromY);
  const cratersCrossed = segmentIntersectsCrater(fromX, fromY, wp.x, wp.y);

  const routeDistanceMultiplier =
    routeProfile === 'safe' ? (cratersCrossed.length > 0 ? 1.38 : 1.22) : 1.06;

  const distanceOneWayKm = round2(straightDistKm * routeDistanceMultiplier);
  const speedKmH =
    SCIENTIFIC_ASSUMPTIONS.rover.nominalSpeedKmPerHour /
    (1 + (wp.terrainDifficulty - 1) * (routeProfile === 'direct' ? 0.35 : 0.25));

  const estimatedHoursOneWay = Math.max(1, Math.ceil(distanceOneWayKm / speedKmH));
  const energyMultiplier = 1 + (wp.terrainDifficulty - 1) * 0.45;
  const estimatedEnergyOneWayKwh = round2(
    distanceOneWayKm * SCIENTIFIC_ASSUMPTIONS.rover.baseEnergyKwhPerKm * energyMultiplier
  );
  const sampleOpsEnergyKwh = 1.8;
  const returnFromBaseDistKm = Math.hypot(wp.x, wp.y) * routeDistanceMultiplier;
  const returnEnergyKwh = round2(
    returnFromBaseDistKm * SCIENTIFIC_ASSUMPTIONS.rover.baseEnergyKwhPerKm * energyMultiplier
  );

  const terrainWearFactor = round2(
    wp.terrainDifficulty *
      (routeProfile === 'direct' ? 1.45 + cratersCrossed.length * 0.35 : 0.72)
  );

  return {
    destinationId,
    routeProfile,
    distanceOneWayKm,
    estimatedHoursOneWay,
    estimatedEnergyOneWayKwh,
    estimatedTotalRoundTripKwh: round2(
      estimatedEnergyOneWayKwh + sampleOpsEnergyKwh + returnEnergyKwh
    ),
    terrainWearFactor,
  };
}
