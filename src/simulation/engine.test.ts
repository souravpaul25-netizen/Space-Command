import { describe, expect, it } from 'vitest';
import { CROP_CATALOG, ROVER_WAYPOINTS } from './config';
import {
  adjustWaterWallShielding,
  collectRoverSample,
  createInitialState,
  dispatchRoverMission,
  harvestCropBay,
  plantCropInBay,
  setElectrolysisMode,
  setGreenhouseLighting,
  stepOneHour,
  toggleCo2Scrubber,
  toggleRadiationShelter,
  toggleWaterRecycler,
} from './engine';
import { computeShieldingTransmission } from './resources';
import { evaluateMission } from './scoring';
import { advanceSimulation } from './time';

describe('Space Command Simulation Engine', () => {
  it('maintains non-negative resource inventories under extreme drain', () => {
    let state = createInitialState({
      initialOxygenKg: 1,
      emergencyOxygenReserveKg: 0,
      initialWaterLitres: 1,
      initialFoodKg: 0.5,
      initialBatteryKwh: 0.5,
    });
    state = setElectrolysisMode(state, 'off');

    for (let i = 0; i < 48; i++) {
      state = stepOneHour(state).state;
      expect(state.oxygenKg).toBeGreaterThanOrEqual(0);
      expect(state.waterLitres).toBeGreaterThanOrEqual(0);
      expect(state.packagedFoodKg).toBeGreaterThanOrEqual(0);
      expect(state.batteryKwh).toBeGreaterThanOrEqual(0);
    }
  });

  it('consumes water and electricity for oxygen electrolysis (no infinite O2 creation)', () => {
    let stateOn = createInitialState({ initialWaterLitres: 200, initialOxygenKg: 50 });
    stateOn = setElectrolysisMode(stateOn, 'boost');
    const waterBefore = stateOn.waterLitres;
    const stepOn = stepOneHour(stateOn).state;

    // With electrolysis on boost, O2 increases (0.24 produced > 0.14 consumed) and extra water is used
    expect(stepOn.oxygenKg).toBeGreaterThan(50);
    expect(stepOn.waterLitres).toBeLessThan(waterBefore);

    // If water is 0, electrolysis cannot create O2
    let dryState = createInitialState({ initialWaterLitres: 0, initialOxygenKg: 40 });
    dryState = setElectrolysisMode(dryState, 'boost');
    const stepDry = stepOneHour(dryState).state;
    expect(stepDry.oxygenKg).toBeLessThan(40);
  });

  it('accumulates CO2 when scrubber is disabled and removes CO2 when enabled', () => {
    let state = createInitialState();
    state = toggleCo2Scrubber(state); // disable
    for (let i = 0; i < 6; i++) {
      state = stepOneHour(state).state;
    }
    const highCo2 = state.co2Ppm;
    expect(highCo2).toBeGreaterThan(2000);

    state = toggleCo2Scrubber(state); // re-enable
    for (let i = 0; i < 6; i++) {
      state = stepOneHour(state).state;
    }
    expect(state.co2Ppm).toBeLessThan(highCo2);
  });

  it('preserves water much better with water recycling enabled vs disabled', () => {
    const base = createInitialState({ initialWaterLitres: 240 });
    let recycled = base;
    let unrecycled = toggleWaterRecycler(base);

    for (let i = 0; i < 24; i++) {
      recycled = stepOneHour(recycled).state;
      unrecycled = stepOneHour(unrecycled).state;
    }
    expect(recycled.waterLitres).toBeGreaterThan(unrecycled.waterLitres + 5);
  });

  it('sheds low-priority loads and drains battery during lunar darkness', () => {
    let state = createInitialState({
      siteId: 'equatorial-ref',
      solarArrayPeakKw: 0,
      initialBatteryKwh: 5,
    });
    state.rover.batteryKwh = 20; // Rover needs charging (2.5 kW)
    // Advance a few hours with zero solar
    for (let i = 0; i < 4; i++) {
      state = stepOneHour(state).state;
    }
    expect(state.batteryKwh).toBeLessThan(5);
    expect(state.powerDeficitKw).toBeGreaterThan(0);
    expect(state.poweredSubsystems.roverDock).toBe(false);
    expect(state.poweredSubsystems.agriculture).toBe(false);
  });

  it('grows crops over time proportional to lighting and adds food on harvest', () => {
    let state = createInitialState({ initialFoodKg: 50 });
    state = plantCropInBay(state, 3, 'lettuce');
    const lettuceHours = CROP_CATALOG.lettuce.growthHours;

    // 100% lighting grows faster than 50% lighting
    let bright = setGreenhouseLighting(state, 100);
    let dim = setGreenhouseLighting(state, 50);
    for (let i = 0; i < 24; i++) {
      bright = stepOneHour(bright).state;
      dim = stepOneHour(dim).state;
    }
    const brightBay3 = bright.cropBays.find((b) => b.bayId === 3)!;
    const dimBay3 = dim.cropBays.find((b) => b.bayId === 3)!;
    expect(brightBay3.growthHoursElapsed).toBeGreaterThan(dimBay3.growthHoursElapsed);

    // Grow lettuce to maturity and harvest
    let harvestState = setGreenhouseLighting(state, 100);
    for (let i = 0; i < lettuceHours + 20; i++) {
      harvestState = stepOneHour(harvestState).state;
    }
    const readyBay = harvestState.cropBays.find((b) => b.bayId === 3)!;
    expect(readyBay.status).toBe('ready');

    const foodBeforeHarvest = harvestState.packagedFoodKg;
    harvestState = harvestCropBay(harvestState, 3);
    expect(harvestState.packagedFoodKg).toBeGreaterThan(foodBeforeHarvest);
    expect(harvestState.greenhouseFoodProducedKg).toBeCloseTo(CROP_CATALOG.lettuce.yieldDryKg, 1);
  });

  it('reduces radiation dose with water shielding and storm shelter', () => {
    const base = createInitialState();
    const unshielded = computeShieldingTransmission(base.shielding);

    const waterAdded = adjustWaterWallShielding(base, 120);
    const waterShielded = computeShieldingTransmission(waterAdded.shielding);
    expect(waterShielded.transmissionFactor).toBeLessThan(unshielded.transmissionFactor);

    const sheltered = toggleRadiationShelter(waterAdded);
    const shelteredTx = computeShieldingTransmission(sheltered.shielding);
    expect(shelteredTx.transmissionFactor).toBeLessThan(waterShielded.transmissionFactor * 0.3);
  });

  it('consumes rover battery and time during traverses and does not auto-convert ice prospects into water', () => {
    let state = createInitialState({ initialWaterLitres: 240 });
    const iceWp = ROVER_WAYPOINTS.find((w) => w.hasPotentialWaterIce)!;
    const initialBattery = state.rover.batteryKwh;

    state = dispatchRoverMission(state, iceWp.id, 'safe');
    expect(state.rover.status).toBe('en-route-outbound');

    // Step until rover arrives
    for (let i = 0; i < 12; i++) {
      state = stepOneHour(state).state;
      if (state.rover.status === 'exploring') break;
    }
    expect(state.rover.status).toBe('exploring');
    expect(state.rover.batteryKwh).toBeLessThan(initialBattery);
    expect(state.rover.discoveredIceSites).toContain(iceWp.name);

    const waterBeforeSample = state.waterLitres;
    state = collectRoverSample(state);
    expect(state.rover.samplesCollected).toBe(1);
    // Water reserves must NOT automatically jump when discovering water-ice
    expect(state.waterLitres).toBeLessThanOrEqual(waterBeforeSample);
  });

  it('interrupts multi-hour time advance when a critical Solar Particle Event warning occurs', () => {
    let state = createInitialState();
    // Advance to hour 200 (just before SPE-1 warning at hour 205)
    for (let i = 0; i < 200; i++) {
      state = stepOneHour(state).state;
    }
    const result = advanceSimulation(state, 24);
    expect(result.interruptedByEvent).toBe(true);
    expect(result.hoursAdvanced).toBeLessThan(24);
    expect(result.state.paused).toBe(true);
  });

  it('triggers mission failure and safety-gated scoring when oxygen runs out', () => {
    let state = createInitialState({
      initialOxygenKg: 0.2,
      emergencyOxygenReserveKg: 0,
    });
    state = setElectrolysisMode(state, 'off');
    for (let i = 0; i < 40; i++) {
      state = stepOneHour(state).state;
      if (state.phase === 'failed') break;
    }
    expect(state.phase).toBe('failed');
    const evaluation = evaluateMission(state);
    expect(evaluation.crewSurvived).toBe(false);
    expect(evaluation.outcomeGrade).toBe('Mission Failure');
    expect(evaluation.overallScore).toBeLessThanOrEqual(35);
  });
});
