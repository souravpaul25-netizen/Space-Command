import {
  CROP_CATALOG,
  DEFAULT_MISSION_CONFIG,
  LUNAR_SITE_PROFILES,
  ROVER_WAYPOINTS,
  SCIENTIFIC_ASSUMPTIONS,
} from './config';
import { processMissionEventsForHour } from './events';
import {
  calculateRoverMissionPlan,
  clamp,
  computeShieldingTransmission,
  computeSubsystemPowerDemands,
  getActivityMultiplier,
  getElectrolysisTargetKgPerHour,
  getNutrientFactor,
  round2,
} from './resources';
import type {
  CrewActivityLevel,
  CropType,
  DecisionLogEntry,
  ElectrolysisMode,
  LightingLevel,
  MissionAlert,
  MissionConfig,
  NutrientMode,
  RouteRiskProfile,
  SimulationState,
  SubsystemId,
} from './types';

const STORAGE_KEY = 'space_command_lunar_sim_v1';

function cloneState(state: SimulationState): SimulationState {
  return JSON.parse(JSON.stringify(state)) as SimulationState;
}

function recordDecision(
  state: SimulationState,
  subsystem: SubsystemId | 'mission',
  actionTitle: string,
  explanation: string
) {
  const entry: DecisionLogEntry = {
    id: `dec-${state.hour}-${state.decisions.length + 1}`,
    hour: state.hour,
    subsystem,
    actionTitle,
    explanation,
  };
  state.decisions.unshift(entry);
  if (state.decisions.length > 60) {
    state.decisions = state.decisions.slice(0, 60);
  }
  state.lastDecisionFeedback = entry;
}

function pushRuntimeAlert(
  state: SimulationState,
  idPrefix: string,
  subsystem: SubsystemId | 'mission',
  severity: MissionAlert['severity'],
  title: string,
  message: string,
  actionHint: string
) {
  // Avoid spamming identical alert every hour
  const existingUnresolved = state.alerts.find(
    (a) => a.id.startsWith(idPrefix) && !a.resolved && state.hour - a.hour < 12
  );
  if (existingUnresolved) return;

  state.alerts.unshift({
    id: `${idPrefix}-${state.hour}`,
    hour: state.hour,
    subsystem,
    severity,
    title,
    message,
    actionHint,
    resolved: false,
  });
  if (state.alerts.length > 40) {
    state.alerts = state.alerts.slice(0, 40);
  }
}

export function createInitialState(
  overrides?: Partial<MissionConfig>
): SimulationState {
  const config: MissionConfig = {
    ...DEFAULT_MISSION_CONFIG,
    ...overrides,
  };
  const site = LUNAR_SITE_PROFILES[config.siteId];
  const initialIllum = site.getIllumination(0);
  const initialSolarKw = round2(config.solarArrayPeakKw * initialIllum);

  const initialState: SimulationState = {
    config,
    hour: 0,
    phase: 'active',
    failureReason: null,
    paused: true,
    pauseReason: null,

    crewHealthPct: 100,
    crewMoralePct: 92,
    crewActivity: 'nominal',

    oxygenKg: config.initialOxygenKg,
    emergencyOxygenKg: config.emergencyOxygenReserveKg,
    emergencyOxygenActive: true,
    cabinO2Kpa: 21.2,
    co2Ppm: 800,
    electrolysisMode: 'balanced',
    co2ScrubberEnabled: true,
    co2ScrubberHealthPct: 100,
    waterLitres: config.initialWaterLitres,
    waterRecyclerEnabled: true,
    waterRecyclerHealthPct: 98,
    waterRecoveryEfficiencyPct: 90,

    solarIlluminationFactor: initialIllum,
    solarGenerationKw: initialSolarKw,
    solarDustLossPct: 2,
    batteryKwh: config.initialBatteryKwh,
    batteryMaxEffectiveKwh: config.batteryCapacityKwh,
    batteryHealthPct: 100,
    totalPowerDemandKw: 5.5,
    totalPowerSuppliedKw: 5.5,
    powerDeficitKw: 0,
    priorities: {
      lifeSupport: 1,
      habitatThermal: 2,
      agriculture: 3,
      roverDock: 4,
    },
    poweredSubsystems: {
      habitatThermal: true,
      lifeSupport: true,
      agriculture: true,
      roverDock: true,
    },
    lastHourBreakdown: {
      habitatKw: 2.4,
      lifeSupportKw: 2.94,
      agricultureKw: 0.75,
      roverDockKw: 0,
      conversionLossKw: 0,
      netBatteryDeltaKwh: 0,
    },

    backgroundRadiationMsvPerHour: SCIENTIFIC_ASSUMPTIONS.radiation.nominalBackgroundMsvPerHour,
    eventRadiationMsvPerHour: 0,
    effectiveDoseRateMsvPerHour: 0.011,
    cumulativeRadiationMsv: 0,
    shielding: {
      aluminiumKg: 3200,
      waterWallLitres: 0,
      regolithBagsKg: 0,
      totalMassBudgetKg: 10000,
      inShelter: false,
      regolithBuildProgressHours: 0,
    },

    packagedFoodKg: config.initialFoodKg,
    greenhouseFoodProducedKg: 0,
    greenhouseLighting: 75,
    greenhouseNutrientMode: 'standard',
    greenhouseHealthPct: 100,
    cropBays: [
      {
        bayId: 1,
        cropType: 'lettuce',
        growthHoursElapsed: 0,
        healthPct: 100,
        status: 'growing',
      },
      {
        bayId: 2,
        cropType: 'potato',
        growthHoursElapsed: 0,
        healthPct: 100,
        status: 'growing',
      },
      {
        bayId: 3,
        cropType: null,
        growthHoursElapsed: 0,
        healthPct: 100,
        status: 'empty',
      },
    ],

    rover: {
      x: 0,
      y: 0,
      status: 'docked',
      batteryKwh: SCIENTIFIC_ASSUMPTIONS.rover.maxBatteryKwh,
      batteryMaxKwh: SCIENTIFIC_ASSUMPTIONS.rover.maxBatteryKwh,
      chargingEnabled: true,
      mobilityHealthPct: 100,
      targetWaypointId: null,
      routeProfile: 'safe',
      legProgressHours: 0,
      legTotalHours: 0,
      samplesCollected: 0,
      visitedWaypointIds: [],
      discoveredIceSites: [],
      discoveredRegolithSites: [],
      commRangeKm: SCIENTIFIC_ASSUMPTIONS.rover.commRangeKm,
    },

    activeEvents: [],
    alerts: [
      {
        id: 'mission-init-0',
        hour: 0,
        subsystem: 'mission',
        severity: 'info',
        title: 'Outpost Commissioned at Lunar South Pole',
        message: `Crew of ${config.crewSize} astronauts stationed at ${site.name}. Initial packaged food covers ~24 days; greenhouse production and water recycling are required for a 30-day margin.`,
        actionHint: 'Review all 5 subsystem consoles and advance time when ready.',
        resolved: false,
      },
    ],
    decisions: [],
    telemetry: [
      {
        hour: 0,
        day: 0,
        oxygenKg: config.initialOxygenKg,
        co2Ppm: 800,
        waterLitres: config.initialWaterLitres,
        foodKg: config.initialFoodKg,
        batteryKwh: config.initialBatteryKwh,
        solarPowerKw: initialSolarKw,
        powerDemandKw: 5.8,
        cumulativeRadiationMsv: 0,
        crewHealthPct: 100,
      },
    ],
    lastDecisionFeedback: null,
  };

  return initialState;
}

export function stepOneHour(prevState: SimulationState): {
  state: SimulationState;
  criticalTriggered: boolean;
  pauseMessage: string | null;
} {
  if (prevState.phase !== 'active') {
    return { state: prevState, criticalTriggered: false, pauseMessage: null };
  }

  const state = cloneState(prevState);
  state.hour += 1;
  const h = state.hour;

  // 1. Events & warnings
  const eventResult = processMissionEventsForHour(state);
  let criticalTriggered = eventResult.criticalTriggered;
  let pauseMessage = eventResult.pauseMessage;

  // 2. Surface Power Generation & Load Allocation
  const site = LUNAR_SITE_PROFILES[state.config.siteId];
  const illum = site.getIllumination(h);
  state.solarIlluminationFactor = illum;

  const trackingFaultActive = state.activeEvents.some(
    (e) => e.active && e.type === 'unexpected-power-dip'
  );
  const trackingMultiplier = trackingFaultActive ? 0.78 : 1.0;
  const dustMultiplier = clamp(1 - state.solarDustLossPct / 100, 0.45, 1.0);

  state.solarGenerationKw = round2(
    state.config.solarArrayPeakKw * illum * dustMultiplier * trackingMultiplier
  );

  state.batteryMaxEffectiveKwh = round2(
    state.config.batteryCapacityKwh * (state.batteryHealthPct / 100)
  );
  state.batteryKwh = clamp(state.batteryKwh, 0, state.batteryMaxEffectiveKwh);

  const demands = computeSubsystemPowerDemands(state);
  state.totalPowerDemandKw = demands.totalDemandKw;

  // Available energy for this 1-hour step: solar + usable battery (considering 92% discharge efficiency)
  const eff = SCIENTIFIC_ASSUMPTIONS.power.batteryRoundTripEfficiency;
  const maxDeliverableFromBatteryKwh = state.batteryKwh * eff;
  const totalAvailableKwh = state.solarGenerationKw + maxDeliverableFromBatteryKwh;

  // Allocate loads strictly by priority order
  const loadItems: Array<{
    key: keyof SimulationState['poweredSubsystems'];
    priority: number;
    kw: number;
  }> = [
    { key: 'lifeSupport', priority: state.priorities.lifeSupport, kw: demands.lifeSupportKw },
    { key: 'habitatThermal', priority: state.priorities.habitatThermal, kw: demands.habitatThermalKw },
    { key: 'agriculture', priority: state.priorities.agriculture, kw: demands.agricultureKw },
    { key: 'roverDock', priority: state.priorities.roverDock, kw: demands.roverDockKw },
  ];
  const loadList = loadItems.sort((a, b) => a.priority - b.priority);

  let remainingEnergyKwh = totalAvailableKwh;
  let suppliedKw = 0;

  for (const item of loadList) {
    if (item.kw <= 0) {
      state.poweredSubsystems[item.key] = true;
      continue;
    }
    if (remainingEnergyKwh >= item.kw) {
      state.poweredSubsystems[item.key] = true;
      remainingEnergyKwh -= item.kw;
      suppliedKw += item.kw;
    } else {
      state.poweredSubsystems[item.key] = false;
    }
  }

  state.totalPowerSuppliedKw = round2(suppliedKw);
  state.powerDeficitKw = round2(Math.max(0, demands.totalDemandKw - suppliedKw));

  // Update battery state cleanly (no infinite generation, round-trip losses accounted)
  const netPowerSurplusKw = state.solarGenerationKw - suppliedKw;
  let netBatteryDeltaKwh = 0;
  let conversionLossKw = 0;

  if (netPowerSurplusKw >= 0) {
    const rawCharge = netPowerSurplusKw * eff;
    conversionLossKw = round2(netPowerSurplusKw - rawCharge);
    const spaceLeft = state.batteryMaxEffectiveKwh - state.batteryKwh;
    const actualAdded = Math.min(spaceLeft, rawCharge);
    state.batteryKwh = round2(state.batteryKwh + actualAdded);
    netBatteryDeltaKwh = round2(actualAdded);
  } else {
    const neededFromBattery = Math.abs(netPowerSurplusKw);
    const batteryDrain = Math.min(state.batteryKwh, neededFromBattery / eff);
    conversionLossKw = round2(batteryDrain - neededFromBattery);
    state.batteryKwh = round2(Math.max(0, state.batteryKwh - batteryDrain));
    netBatteryDeltaKwh = round2(-batteryDrain);
  }

  state.lastHourBreakdown = {
    habitatKw: state.poweredSubsystems.habitatThermal ? demands.habitatThermalKw : 0,
    lifeSupportKw: state.poweredSubsystems.lifeSupport ? demands.lifeSupportKw : 0,
    agricultureKw: state.poweredSubsystems.agriculture ? demands.agricultureKw : 0,
    roverDockKw: state.poweredSubsystems.roverDock ? demands.roverDockKw : 0,
    conversionLossKw,
    netBatteryDeltaKwh,
  };

  if (state.powerDeficitKw > 0.2) {
    pushRuntimeAlert(
      state,
      'power-shed',
      'power',
      'warning',
      'Power Load Shedding Active',
      `Solar + battery reserves could not supply full ${demands.totalDemandKw} kW demand. Lower-priority loads were shed.`,
      'Lower greenhouse lighting, pause rover charging, or clean lunar dust from arrays.'
    );
  }

  // 3. Life Support & Atmosphere
  const activityMult =
    getActivityMultiplier(state.crewActivity) * (state.shielding.inShelter ? 1.06 : 1.0);
  const hourlyO2ConsumedKg =
    (state.config.crewSize *
      SCIENTIFIC_ASSUMPTIONS.lifeSupport.o2ConsumptionKgPerPersonDay *
      activityMult) /
    24;

  // Electrolysis requires power AND sufficient water
  let hourlyO2ProducedKg = 0;
  let electrolysisWaterUsedL = 0;
  if (state.poweredSubsystems.lifeSupport && state.electrolysisMode !== 'off') {
    const targetO2Kg = getElectrolysisTargetKgPerHour(state.electrolysisMode);
    const maxPossibleFromWater =
      state.waterLitres / SCIENTIFIC_ASSUMPTIONS.lifeSupport.electrolysisWaterPerKgO2;
    hourlyO2ProducedKg = Math.min(targetO2Kg, maxPossibleFromWater);
    electrolysisWaterUsedL =
      hourlyO2ProducedKg * SCIENTIFIC_ASSUMPTIONS.lifeSupport.electrolysisWaterPerKgO2;
  }

  state.waterLitres = Math.max(0, state.waterLitres - electrolysisWaterUsedL);
  state.oxygenKg = clamp(
    state.oxygenKg + hourlyO2ProducedKg - hourlyO2ConsumedKg,
    0,
    state.config.maxOxygenKg
  );

  // Emergency O2 reserve engagement if main O2 tanks drop dangerously low
  if (state.oxygenKg < 4 && state.emergencyOxygenActive && state.emergencyOxygenKg > 0) {
    const transfer = Math.min(state.emergencyOxygenKg, 0.45);
    state.emergencyOxygenKg = round2(state.emergencyOxygenKg - transfer);
    state.oxygenKg = round2(state.oxygenKg + transfer);
    pushRuntimeAlert(
      state,
      'o2-emerg',
      'life-support',
      'critical',
      'Emergency Oxygen Backup Engaged',
      'Primary O2 tanks fell below 4 kg. High-pressure emergency reserve is feeding the cabin.',
      'Enable O2 Electrolysis and verify water and power supply immediately.'
    );
    criticalTriggered = true;
    pauseMessage = pauseMessage ?? 'Primary oxygen depleted — Emergency O2 reserve active.';
  }

  // Cabin O2 partial pressure indicator (nominal 21.2 kPa when reserve > 5 kg)
  state.cabinO2Kpa =
    state.oxygenKg > 5
      ? 21.2
      : round2(clamp(12 + (state.oxygenKg / 5) * 9.2, 10, 21.2));

  // CO2 Dynamics (well-mixed 180 m3 habitat model)
  // 1 kg CO2 in 180 m3 air at 101.3 kPa ~ 3080 ppm increase per hour
  const hourlyCo2Kg =
    (state.config.crewSize *
      SCIENTIFIC_ASSUMPTIONS.lifeSupport.co2ProductionKgPerPersonDay *
      activityMult) /
    24;
  const co2AddedPpm = hourlyCo2Kg * 3080;

  let co2RemovedPpm = 0;
  if (state.poweredSubsystems.lifeSupport && state.co2ScrubberEnabled) {
    // Healthy scrubber removes up to ~950 ppm/hr proportional to cabin CO2 & health
    const scrubberCapacity = 960 * (state.co2ScrubberHealthPct / 100);
    co2RemovedPpm = Math.min(state.co2Ppm + co2AddedPpm - 400, scrubberCapacity);
    co2RemovedPpm = Math.max(0, co2RemovedPpm);
    // Normal slow wear
    state.co2ScrubberHealthPct = Math.max(25, round2(state.co2ScrubberHealthPct - 0.025));
  }

  state.co2Ppm = Math.round(clamp(state.co2Ppm + co2AddedPpm - co2RemovedPpm, 400, 45000));

  if (state.co2Ppm >= 5000) {
    pushRuntimeAlert(
      state,
      'co2-high',
      'life-support',
      state.co2Ppm >= 12000 ? 'critical' : 'warning',
      'Elevated Cabin Carbon Dioxide',
      `Cabin CO2 reached ${state.co2Ppm} ppm (nominal < 2,000 ppm).`,
      'Ensure CO2 Scrubber is enabled, powered, and serviced in Life Support.'
    );
    if (state.co2Ppm >= 12000) {
      criticalTriggered = true;
      pauseMessage = pauseMessage ?? `Critical cabin CO2 concentration (${state.co2Ppm} ppm).`;
    }
  }

  // Water Consumption & Recycling (Module 01 & Module 04 link)
  const crewWaterGrossL =
    (state.config.crewSize * SCIENTIFIC_ASSUMPTIONS.lifeSupport.waterUseLitresPerPersonDay) / 24;

  // Water recovery efficiency depends on recycler status, power, and health
  const maxRecovery = 0.94 * (state.waterRecyclerHealthPct / 100);
  const actualRecoveryFraction =
    state.poweredSubsystems.lifeSupport && state.waterRecyclerEnabled ? clamp(maxRecovery, 0.3, 0.94) : 0;
  state.waterRecoveryEfficiencyPct = round2(actualRecoveryFraction * 100);

  const netCrewWaterLossL = crewWaterGrossL * (1 - actualRecoveryFraction);
  state.waterLitres = round2(
    clamp(state.waterLitres - netCrewWaterLossL, 0, state.config.maxWaterLitres)
  );
  if (state.waterRecyclerEnabled && state.poweredSubsystems.lifeSupport) {
    state.waterRecyclerHealthPct = Math.max(30, round2(state.waterRecyclerHealthPct - 0.02));
  }

  if (state.waterLitres < 35) {
    pushRuntimeAlert(
      state,
      'water-low',
      'life-support',
      state.waterLitres < 15 ? 'critical' : 'warning',
      'Low Potable Water Reserves',
      `Remaining outpost water is ${state.waterLitres.toFixed(1)} L.`,
      'Service Water Recycler, lower greenhouse water usage, or drain water-wall shielding if urgent.'
    );
  }

  // 4. Food Production & Greenhouse (Module 04)
  const hourlyFoodConsumedKg =
    (state.config.crewSize * SCIENTIFIC_ASSUMPTIONS.agriculture.foodKgPerPersonDay) / 24;
  state.packagedFoodKg = round2(Math.max(0, state.packagedFoodKg - hourlyFoodConsumedKg));

  const nutrientFx = getNutrientFactor(state.greenhouseNutrientMode);
  const lightFactor = state.poweredSubsystems.agriculture
    ? state.greenhouseLighting / 100
    : 0;

  let greenhouseMoraleLift = 0;
  for (const bay of state.cropBays) {
    if (!bay.cropType || bay.status !== 'growing') continue;
    const crop = CROP_CATALOG[bay.cropType];

    // Crop water demand (scaled by light & nutrient mode); WRS recovers 55% of transpiration!
    const cropWaterDemandL =
      crop.waterLitresPerHour *
      (0.35 + 0.65 * lightFactor) *
      nutrientFx.waterMultiplier;

    if (state.waterLitres >= cropWaterDemandL) {
      const transpiredRecoveredL =
        cropWaterDemandL * 0.55 * actualRecoveryFraction;
      state.waterLitres = round2(
        Math.max(0, state.waterLitres - cropWaterDemandL + transpiredRecoveredL)
      );

      // Growth rate scales with lighting, nutrient mode, and greenhouse health
      const healthFactor = state.greenhouseHealthPct / 100;
      const growthStep =
        lightFactor > 0.1
          ? lightFactor * nutrientFx.growthMultiplier * healthFactor
          : 0.05;
      bay.growthHoursElapsed = round2(bay.growthHoursElapsed + growthStep);

      // Unlit or unpowered bay slowly stresses plant health
      if (lightFactor < 0.25) {
        bay.healthPct = Math.max(0, round2(bay.healthPct - 1.4));
      } else {
        bay.healthPct = clamp(
          round2(bay.healthPct + (state.greenhouseHealthPct > 75 ? 0.25 : -0.4)),
          0,
          100
        );
      }
    } else {
      // Water starvation damages crop
      bay.healthPct = Math.max(0, round2(bay.healthPct - 3.5));
    }

    if (bay.healthPct <= 10) {
      bay.status = 'failed';
      bay.failureReason =
        state.waterLitres < 2
          ? 'Depleted irrigation water'
          : 'Prolonged power/lighting loss or blight';
      pushRuntimeAlert(
        state,
        `crop-fail-${bay.bayId}`,
        'agriculture',
        'warning',
        `Greenhouse Bay ${bay.bayId} Crop Failed`,
        `${crop.name} failed due to ${bay.failureReason?.toLowerCase()}.`,
        'Clear the bay in Food & Water and replant once power and water stabilize.'
      );
    } else if (bay.growthHoursElapsed >= crop.growthHours) {
      bay.status = 'ready';
      greenhouseMoraleLift += 0.2;
      pushRuntimeAlert(
        state,
        `crop-ready-${bay.bayId}`,
        'agriculture',
        'info',
        `Greenhouse Bay ${bay.bayId} Ready for Harvest`,
        `${crop.name} has reached maturity (+${crop.yieldDryKg} kg dry-equivalent food).`,
        'Harvest the bay in Food & Water to add food to outpost reserves.'
      );
    }
  }

  // 5. Radiation Protection (Module 03)
  const transmission = computeShieldingTransmission(state.shielding);
  const rawFlux = state.backgroundRadiationMsvPerHour + state.eventRadiationMsvPerHour;
  state.effectiveDoseRateMsvPerHour = Number((rawFlux * transmission.transmissionFactor).toFixed(4));
  state.cumulativeRadiationMsv = Number(
    (state.cumulativeRadiationMsv + state.effectiveDoseRateMsvPerHour).toFixed(3)
  );

  // If regolith shielding construction is ongoing (auto-incremented by button or crew effort)
  // Note: handled via player action with crew work simulation.

  // 6. Rover Operations (Module 05)
  const rover = state.rover;
  if (rover.status === 'docked') {
    if (
      state.poweredSubsystems.roverDock &&
      rover.chargingEnabled &&
      rover.batteryKwh < rover.batteryMaxKwh
    ) {
      rover.batteryKwh = round2(
        Math.min(rover.batteryMaxKwh, rover.batteryKwh + SCIENTIFIC_ASSUMPTIONS.power.roverDockChargeKw * 0.94)
      );
    }
  } else if (rover.status === 'en-route-outbound' || rover.status === 'en-route-return') {
    const wp = ROVER_WAYPOINTS.find((w) => w.id === rover.targetWaypointId);
    const plan = wp
      ? calculateRoverMissionPlan(wp.id, rover.routeProfile, 0, 0)
      : null;

    const hourlyEnergy = plan
      ? plan.estimatedEnergyOneWayKwh / Math.max(1, plan.estimatedHoursOneWay)
      : 2.2;
    const hourlyWear = plan ? (plan.terrainWearFactor * 0.65) : 0.8;

    if (rover.batteryKwh <= hourlyEnergy * 0.5) {
      rover.batteryKwh = 0;
      rover.status = 'stranded';
      pushRuntimeAlert(
        state,
        'rover-stranded',
        'rover',
        'critical',
        'Lunar Rover Out of Battery',
        'The exploration rover exhausted its battery reserve away from the habitat dock.',
        'Check energy reserves before dispatching long traverses.'
      );
    } else {
      rover.batteryKwh = round2(Math.max(0, rover.batteryKwh - hourlyEnergy));
      rover.mobilityHealthPct = round2(Math.max(15, rover.mobilityHealthPct - hourlyWear));
      rover.legProgressHours += 1;

      if (wp && rover.legTotalHours > 0) {
        const frac = clamp(rover.legProgressHours / rover.legTotalHours, 0, 1);
        if (rover.status === 'en-route-outbound') {
          rover.x = round2(wp.x * frac);
          rover.y = round2(wp.y * frac);
          if (rover.legProgressHours >= rover.legTotalHours) {
            rover.x = wp.x;
            rover.y = wp.y;
            rover.status = 'exploring';
            if (!rover.visitedWaypointIds.includes(wp.id)) {
              rover.visitedWaypointIds.push(wp.id);
            }
            if (wp.hasPotentialWaterIce && !rover.discoveredIceSites.includes(wp.name)) {
              rover.discoveredIceSites.push(wp.name);
            }
            if (wp.hasRegolithDeposit && !rover.discoveredRegolithSites.includes(wp.name)) {
              rover.discoveredRegolithSites.push(wp.name);
            }
            pushRuntimeAlert(
              state,
              `rover-arrived-${wp.id}`,
              'rover',
              'info',
              `Rover Arrived: ${wp.name}`,
              `Rover reached ${wp.name}.${wp.hasPotentialWaterIce ? ' Neutron spectrometer detected potential water-ice signatures (requires dedicated ISRU plant for extraction).' : ''}`,
              'Collect scientific samples and initiate return to base.'
            );
          }
        } else {
          rover.x = round2(wp.x * (1 - frac));
          rover.y = round2(wp.y * (1 - frac));
          if (rover.legProgressHours >= rover.legTotalHours) {
            rover.x = 0;
            rover.y = 0;
            rover.status = 'docked';
            rover.targetWaypointId = null;
            rover.legProgressHours = 0;
            rover.legTotalHours = 0;
            pushRuntimeAlert(
              state,
              'rover-docked',
              'rover',
              'info',
              'Rover Safely Returned to Habitat Dock',
              'Surface samples secured. Rover is docked for recharging and inspection.',
              'Review findings in Lunar Surface.'
            );
          }
        }
      }
    }
  }

  // 7. Crew Health & Morale Integration
  let healthDelta = 0.08; // Nominal recovery when all systems green
  let moraleDelta = greenhouseMoraleLift;

  if (state.oxygenKg <= 0.5) healthDelta -= 4.5;
  if (state.co2Ppm > 5000) healthDelta -= (state.co2Ppm - 5000) / 3500;
  if (state.waterLitres <= 0.5) healthDelta -= 3.2;
  if (state.packagedFoodKg <= 0.2) healthDelta -= 1.6;
  if (!state.poweredSubsystems.habitatThermal) healthDelta -= 1.4;
  if (state.effectiveDoseRateMsvPerHour > 0.15) {
    healthDelta -= state.effectiveDoseRateMsvPerHour * 2.5;
  }

  if (state.shielding.inShelter) moraleDelta -= 0.35;
  else if (state.crewActivity === 'high') moraleDelta -= 0.15;
  else moraleDelta += 0.05;

  if (!state.poweredSubsystems.habitatThermal || state.co2Ppm > 4000) {
    moraleDelta -= 0.4;
  }

  state.crewHealthPct = round2(clamp(state.crewHealthPct + healthDelta, 0, 100));
  state.crewMoralePct = round2(clamp(state.crewMoralePct + moraleDelta, 5, 100));

  // 8. Check Failure & Completion Conditions
  if (state.crewHealthPct <= 0) {
    state.phase = 'failed';
    state.paused = true;
    state.failureReason =
      state.oxygenKg <= 0.5
        ? 'Oxygen depletion in habitat atmosphere.'
        : state.co2Ppm >= 20000
        ? 'Severe hypercapnia from unmitigated CO2 buildup.'
        : state.waterLitres <= 0.5
        ? 'Total depletion of potable water reserves.'
        : 'Sustained multi-system environmental failure.';
  } else if (state.cumulativeRadiationMsv >= 250) {
    state.phase = 'failed';
    state.paused = true;
    state.failureReason = 'Cumulative crew radiation dose exceeded 250 mSv emergency limit.';
  } else if (h >= state.config.missionDurationDays * 24) {
    state.phase = 'completed';
    state.paused = true;
  }

  // 9. Append Telemetry Snapshot
  state.telemetry.push({
    hour: state.hour,
    day: Number((state.hour / 24).toFixed(2)),
    oxygenKg: state.oxygenKg,
    co2Ppm: state.co2Ppm,
    waterLitres: state.waterLitres,
    foodKg: state.packagedFoodKg,
    batteryKwh: state.batteryKwh,
    solarPowerKw: state.solarGenerationKw,
    powerDemandKw: state.totalPowerDemandKw,
    cumulativeRadiationMsv: state.cumulativeRadiationMsv,
    crewHealthPct: state.crewHealthPct,
  });

  return { state, criticalTriggered, pauseMessage };
}

// ---------------------------------------------------------------------------
// Player Engineering Action Handlers (all record educational explanations)
// ---------------------------------------------------------------------------

export function setCrewActivity(
  prev: SimulationState,
  activity: CrewActivityLevel
): SimulationState {
  const state = cloneState(prev);
  state.crewActivity = activity;
  const label =
    activity === 'resting' ? 'Resting' : activity === 'nominal' ? 'Nominal' : 'High Activity';
  recordDecision(
    state,
    'life-support',
    `Crew Activity set to ${label}`,
    activity === 'resting'
      ? 'Resting reduces metabolic O2 consumption and CO2 generation by 15%, extending atmospheric reserves during emergencies.'
      : activity === 'high'
      ? 'High activity accelerates outpost maintenance and construction, but raises crew O2 consumption and CO2 output by 28%.'
      : 'Nominal operations balance daily research tasks with standard 0.84 kg/person/day O2 metabolic demand.'
  );
  return state;
}

export function setElectrolysisMode(
  prev: SimulationState,
  mode: ElectrolysisMode
): SimulationState {
  const state = cloneState(prev);
  state.electrolysisMode = mode;
  recordDecision(
    state,
    'life-support',
    `O2 Electrolysis set to ${mode.toUpperCase()}`,
    mode === 'off'
      ? 'Turning electrolysis off saves electricity and water immediately, but crew will draw down stored O2 tanks.'
      : mode === 'boost'
      ? 'Boost electrolysis splits extra water into oxygen (consuming ~1.4 kW and 0.27 L/h water) to rebuild O2 reserves.'
      : 'Balanced electrolysis matches 4-astronaut metabolic O2 consumption using recycled water and solar electricity.'
  );
  return state;
}

export function toggleCo2Scrubber(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.co2ScrubberEnabled = !state.co2ScrubberEnabled;
  recordDecision(
    state,
    'life-support',
    state.co2ScrubberEnabled ? 'CO2 Scrubber Enabled' : 'CO2 Scrubber Disabled',
    state.co2ScrubberEnabled
      ? 'Re-activating the amine CO2 scrubber draws 1.0 kW to prevent dangerous cabin carbon dioxide buildup.'
      : 'Disabling the CO2 scrubber saves 1.0 kW of power temporarily, but cabin CO2 concentration will climb rapidly.'
  );
  return state;
}

export function toggleWaterRecycler(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.waterRecyclerEnabled = !state.waterRecyclerEnabled;
  recordDecision(
    state,
    'life-support',
    state.waterRecyclerEnabled ? 'Water Recovery System Enabled' : 'Water Recovery System Paused',
    state.waterRecyclerEnabled
      ? 'Water distillation recovery consumes 1.1 kW to reclaim up to 94% of wastewater and greenhouse humidity.'
      : 'Pausing water recycling saves 1.1 kW, but outpost water tanks will lose ~11.2 L every day.'
  );
  return state;
}

export function toggleEmergencyOxygen(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.emergencyOxygenActive = !state.emergencyOxygenActive;
  recordDecision(
    state,
    'life-support',
    state.emergencyOxygenActive ? 'Emergency O2 Auto-Feed Armed' : 'Emergency O2 Auto-Feed Disarmed',
    'Arming the high-pressure emergency reserve protects the crew automatically if main oxygen tanks drop below 4 kg.'
  );
  return state;
}

export function repairLifeSupportEquipment(
  prev: SimulationState,
  target: 'scrubber' | 'recycler'
): SimulationState {
  const state = cloneState(prev);
  if (target === 'scrubber') {
    state.co2ScrubberHealthPct = 100;
    state.alerts
      .filter((a) => a.subsystem === 'life-support' && a.title.includes('Scrubber'))
      .forEach((a) => (a.resolved = true));
    recordDecision(
      state,
      'life-support',
      'CO2 Scrubber Serviced (100% Health)',
      'Replacing fouled sorbent cartridges restores full CO2 scrubbing capacity and prevents hypercapnia.'
    );
  } else {
    state.waterRecyclerHealthPct = 100;
    state.alerts
      .filter((a) => a.subsystem === 'life-support' && a.title.includes('Water'))
      .forEach((a) => (a.resolved = true));
    recordDecision(
      state,
      'life-support',
      'Water Recycler Membrane Serviced (100% Health)',
      'Clearing membrane fouling restores ~90%+ closed-loop water recovery efficiency.'
    );
  }
  return state;
}

export function cleanSolarArrays(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  const recovered = round2(state.solarDustLossPct);
  state.solarDustLossPct = 0;
  state.alerts
    .filter((a) => a.subsystem === 'power' && a.title.includes('Dust'))
    .forEach((a) => (a.resolved = true));
  recordDecision(
    state,
    'power',
    `Solar Arrays Cleaned (-${recovered}% dust loss)`,
    'Clearing electrostatically charged lunar regolith dust restores full photovoltaic efficiency across the array.'
  );
  return state;
}

export function rebalanceBatteryBank(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.batteryHealthPct = Math.min(100, state.batteryHealthPct + 12);
  state.batteryMaxEffectiveKwh = round2(
    state.config.batteryCapacityKwh * (state.batteryHealthPct / 100)
  );
  state.alerts
    .filter((a) => a.subsystem === 'power' && a.title.includes('Battery'))
    .forEach((a) => (a.resolved = true));
  recordDecision(
    state,
    'power',
    'Battery Cell Thermal Rebalancing Complete',
    'Equalizing lithium-ion cell voltages recovers usable energy storage capacity for polar crater shadows.'
  );
  return state;
}

export function setLoadPriorityPreset(
  prev: SimulationState,
  preset: 'life-first' | 'agriculture-boost' | 'rover-ops'
): SimulationState {
  const state = cloneState(prev);
  if (preset === 'life-first') {
    state.priorities = { lifeSupport: 1, habitatThermal: 2, agriculture: 3, roverDock: 4 };
    recordDecision(
      state,
      'power',
      'Power Priority: Crew Survival First',
      'Life Support and Habitat Thermal receive highest priority; Greenhouse and Rover Dock shed first during deficits.'
    );
  } else if (preset === 'agriculture-boost') {
    state.priorities = { lifeSupport: 1, agriculture: 2, habitatThermal: 3, roverDock: 4 };
    recordDecision(
      state,
      'power',
      'Power Priority: Protect Greenhouse Crops',
      'Prioritizes greenhouse lighting above rover charging and secondary thermal loads to prevent crop failure.'
    );
  } else {
    state.priorities = { lifeSupport: 1, habitatThermal: 2, roverDock: 3, agriculture: 4 };
    recordDecision(
      state,
      'power',
      'Power Priority: Rover Fast-Charge',
      'Prioritizes rover battery charging ahead of greenhouse lighting when solar power is tight.'
    );
  }
  return state;
}

export function adjustWaterWallShielding(
  prev: SimulationState,
  deltaLitres: number
): SimulationState {
  const state = cloneState(prev);
  const current = state.shielding.waterWallLitres;
  const maxByMassBudget =
    state.shielding.totalMassBudgetKg -
    state.shielding.aluminiumKg -
    state.shielding.regolithBagsKg;

  if (deltaLitres > 0) {
    // Do not allow draining potable water below a 40 L safety floor
    const availableToMove = Math.max(0, state.waterLitres - 40);
    const addable = Math.min(deltaLitres, availableToMove, maxByMassBudget - current);
    if (addable <= 0) return prev;
    state.waterLitres = round2(state.waterLitres - addable);
    state.shielding.waterWallLitres = round2(current + addable);
    recordDecision(
      state,
      'radiation',
      `Allocated +${addable} L to Water Radiation Wall`,
      `Moving ${addable} L into habitat wall bladders improves proton radiation attenuation, but reduces your active drinking/electrolysis water reserve.`
    );
  } else if (deltaLitres < 0) {
    const removable = Math.min(Math.abs(deltaLitres), current);
    if (removable <= 0) return prev;
    const spaceInTank = state.config.maxWaterLitres - state.waterLitres;
    const actualMoved = Math.min(removable, spaceInTank);
    state.shielding.waterWallLitres = round2(current - actualMoved);
    state.waterLitres = round2(state.waterLitres + actualMoved);
    recordDecision(
      state,
      'radiation',
      `Reclaimed ${actualMoved} L from Water Shielding Wall`,
      'Draining water bladders returns potable water to active reserves at the cost of higher radiation exposure.'
    );
  }
  return state;
}

export function addRegolithShielding(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  const stepKg = 450;
  const remainingMassRoom =
    state.shielding.totalMassBudgetKg -
    state.shielding.aluminiumKg -
    state.shielding.waterWallLitres -
    state.shielding.regolithBagsKg;

  const added = Math.min(stepKg, remainingMassRoom);
  if (added <= 0) return prev;
  state.shielding.regolithBagsKg = round2(state.shielding.regolithBagsKg + added);
  state.shielding.regolithBuildProgressHours += 1;
  recordDecision(
    state,
    'radiation',
    `Placed +${added} kg Lunar Regolith Berm`,
    'In-situ lunar regolith shielding uses local soil instead of Earth-launched mass to block cosmic rays and solar proton events.'
  );
  return state;
}

export function toggleRadiationShelter(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.shielding.inShelter = !state.shielding.inShelter;
  recordDecision(
    state,
    'radiation',
    state.shielding.inShelter ? 'Crew Entered Radiation Storm Shelter' : 'Crew Exited Storm Shelter',
    state.shielding.inShelter
      ? 'Sheltering cuts radiation dose rate by ~82% during solar particle events, while slightly raising cabin metabolic density and shelter power.'
      : 'Exiting the storm shelter restores full crew productivity and morale once surface proton flux subsides.'
  );
  return state;
}

export function plantCropInBay(
  prev: SimulationState,
  bayId: number,
  cropType: CropType
): SimulationState {
  const state = cloneState(prev);
  const bay = state.cropBays.find((b) => b.bayId === bayId);
  if (!bay) return prev;
  const crop = CROP_CATALOG[cropType];
  bay.cropType = cropType;
  bay.growthHoursElapsed = 0;
  bay.healthPct = 100;
  bay.status = 'growing';
  bay.failureReason = undefined;
  recordDecision(
    state,
    'agriculture',
    `Planted ${crop.name} in Bay ${bayId}`,
    `${crop.name} matures in ${(crop.growthHours / 24).toFixed(0)} days, yielding ${crop.yieldDryKg} kg food while consuming ${crop.waterLitresPerHour} L/h water and up to ${crop.powerKwAtFullLight} kW lighting.`
  );
  return state;
}

export function harvestCropBay(prev: SimulationState, bayId: number): SimulationState {
  const state = cloneState(prev);
  const bay = state.cropBays.find((b) => b.bayId === bayId);
  if (!bay || !bay.cropType || bay.status !== 'ready') return prev;
  const crop = CROP_CATALOG[bay.cropType];
  state.packagedFoodKg = round2(state.packagedFoodKg + crop.yieldDryKg);
  state.greenhouseFoodProducedKg = round2(state.greenhouseFoodProducedKg + crop.yieldDryKg);
  state.crewMoralePct = clamp(round2(state.crewMoralePct + crop.moraleBonus), 0, 100);
  bay.cropType = null;
  bay.growthHoursElapsed = 0;
  bay.healthPct = 100;
  bay.status = 'empty';
  recordDecision(
    state,
    'agriculture',
    `Harvested ${crop.name} (+${crop.yieldDryKg} kg Food)`,
    `Fresh harvest added ${crop.yieldDryKg} kg edible biomass to outpost food stores and boosted crew morale by +${crop.moraleBonus}%.`
  );
  return state;
}

export function clearCropBay(prev: SimulationState, bayId: number): SimulationState {
  const state = cloneState(prev);
  const bay = state.cropBays.find((b) => b.bayId === bayId);
  if (!bay) return prev;
  bay.cropType = null;
  bay.growthHoursElapsed = 0;
  bay.healthPct = 100;
  bay.status = 'empty';
  bay.failureReason = undefined;
  recordDecision(
    state,
    'agriculture',
    `Cleared Greenhouse Bay ${bayId}`,
    'Sanitized and reset crop tray for replanting.'
  );
  return state;
}

export function setGreenhouseLighting(
  prev: SimulationState,
  level: LightingLevel
): SimulationState {
  const state = cloneState(prev);
  state.greenhouseLighting = level;
  const activeCount = state.cropBays.filter((b) => b.status === 'growing').length;
  recordDecision(
    state,
    'agriculture',
    `Greenhouse LED Lighting set to ${level}%`,
    level < 75
      ? `Dimming LEDs saves electrical power for batteries and life support across ${activeCount} active bay(s), but slows photosynthesis and delays harvest.`
      : `Setting LEDs to ${level}% maximizes crop growth speed at the cost of higher continuous electrical draw.`
  );
  return state;
}

export function setGreenhouseNutrientMode(
  prev: SimulationState,
  mode: NutrientMode
): SimulationState {
  const state = cloneState(prev);
  state.greenhouseNutrientMode = mode;
  recordDecision(
    state,
    'agriculture',
    `Hydroponic Nutrient Mode: ${mode.toUpperCase()}`,
    mode === 'eco'
      ? 'Eco dosing conserves 18% irrigation water at the cost of 22% slower crop development.'
      : mode === 'rich'
      ? 'Rich nutrient dosing accelerates growth by 18%, consuming 15% more water per hour.'
      : 'Standard nutrient dosing balances water efficiency and steady biomass growth.'
  );
  return state;
}

export function repairGreenhouse(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.greenhouseHealthPct = 100;
  state.alerts
    .filter((a) => a.subsystem === 'agriculture' && a.title.includes('Oxygenation'))
    .forEach((a) => (a.resolved = true));
  recordDecision(
    state,
    'agriculture',
    'Greenhouse Hydroponics Calibrated',
    'Restored root-zone oxygenation and nutrient manifold balance to 100% health.'
  );
  return state;
}

export function dispatchRoverMission(
  prev: SimulationState,
  waypointId: string,
  routeProfile: RouteRiskProfile
): SimulationState {
  const state = cloneState(prev);
  if (state.rover.status !== 'docked') return prev;
  const wp = ROVER_WAYPOINTS.find((w) => w.id === waypointId);
  const plan = calculateRoverMissionPlan(waypointId, routeProfile, 0, 0);
  if (!wp || !plan) return prev;

  // Enforce safe launch energy check (require at least 90% of round-trip energy so students see planning constraint)
  if (state.rover.batteryKwh < plan.estimatedTotalRoundTripKwh * 0.92) {
    pushRuntimeAlert(
      state,
      'rover-energy-block',
      'rover',
      'warning',
      'Insufficient Rover Battery for Safe Return',
      `${wp.name} requires ~${plan.estimatedTotalRoundTripKwh} kWh round-trip, but rover only has ${state.rover.batteryKwh.toFixed(1)} kWh.`,
      'Enable Rover Charging at the dock or choose a closer waypoint.'
    );
    return state;
  }

  state.rover.status = 'en-route-outbound';
  state.rover.targetWaypointId = wp.id;
  state.rover.routeProfile = routeProfile;
  state.rover.legProgressHours = 0;
  state.rover.legTotalHours = plan.estimatedHoursOneWay;

  recordDecision(
    state,
    'rover',
    `Dispatched Rover to ${wp.name} (${routeProfile} route)`,
    routeProfile === 'safe'
      ? `Safe detour travels ${plan.distanceOneWayKm} km (~${plan.estimatedHoursOneWay}h) around craters, using slightly more energy to protect wheel mobility.`
      : `Direct route travels ${plan.distanceOneWayKm} km (~${plan.estimatedHoursOneWay}h) with higher terrain wear risk.`
  );
  return state;
}

export function collectRoverSample(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  if (state.rover.status !== 'exploring') return prev;
  if (state.rover.batteryKwh < 2.0) return prev;
  state.rover.batteryKwh = round2(state.rover.batteryKwh - 1.8);
  state.rover.samplesCollected += 1;
  const wp = ROVER_WAYPOINTS.find((w) => w.id === state.rover.targetWaypointId);
  recordDecision(
    state,
    'rover',
    `Collected Sample #${state.rover.samplesCollected} at ${wp?.name ?? 'Site'}`,
    'Core drilling consumed 1.8 kWh of rover battery. Discovered polar ice signatures remain unrefined prospects until dedicated ISRU hardware is deployed.'
  );
  return state;
}

export function returnRoverToBase(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  if (
    state.rover.status !== 'exploring' &&
    state.rover.status !== 'en-route-outbound'
  ) {
    return prev;
  }
  const wp = ROVER_WAYPOINTS.find((w) => w.id === state.rover.targetWaypointId);
  const currentDistKm = Math.hypot(state.rover.x, state.rover.y);
  const plan = wp
    ? calculateRoverMissionPlan(wp.id, state.rover.routeProfile, 0, 0)
    : null;
  const returnHours = Math.max(
    1,
    plan
      ? Math.ceil(
          (currentDistKm / Math.max(0.5, Math.hypot(wp!.x, wp!.y))) *
            plan.estimatedHoursOneWay
        )
      : Math.ceil(currentDistKm / 3.0)
  );
  state.rover.status = 'en-route-return';
  state.rover.legProgressHours = 0;
  state.rover.legTotalHours = returnHours;
  recordDecision(
    state,
    'rover',
    'Rover Returning to Habitat Dock',
    `Initiated ${returnHours}-hour return traverse from (${state.rover.x.toFixed(1)}, ${state.rover.y.toFixed(1)}) km.`
  );
  return state;
}

export function toggleRoverCharging(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  state.rover.chargingEnabled = !state.rover.chargingEnabled;
  recordDecision(
    state,
    'rover',
    state.rover.chargingEnabled ? 'Rover Dock Charging Enabled' : 'Rover Dock Charging Paused',
    state.rover.chargingEnabled
      ? 'Rover dock draws up to 2.5 kW from the outpost microgrid when docked.'
      : 'Pausing rover charging frees 2.5 kW for life support and greenhouse lighting.'
  );
  return state;
}

export function repairRoverMobility(prev: SimulationState): SimulationState {
  const state = cloneState(prev);
  if (state.rover.status !== 'docked') return prev;
  state.rover.mobilityHealthPct = 100;
  recordDecision(
    state,
    'rover',
    'Rover Mobility & Wheels Serviced',
    'Cleared regolith grit from wheel actuators and restored mobility health to 100%.'
  );
  return state;
}

// ---------------------------------------------------------------------------
// LocalStorage Persistence
// ---------------------------------------------------------------------------

export function saveSimulationToStorage(state: SimulationState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadSimulationFromStorage(): SimulationState | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SimulationState;
      if (parsed && typeof parsed.hour === 'number' && parsed.config) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed saved state
  }
  return null;
}

export function clearSimulationStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}
