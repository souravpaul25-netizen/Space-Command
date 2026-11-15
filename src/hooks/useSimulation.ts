import { useCallback, useEffect, useState } from 'react';
import {
  addRegolithShielding,
  adjustWaterWallShielding,
  cleanSolarArrays,
  clearCropBay,
  clearSimulationStorage,
  collectRoverSample,
  createInitialState,
  dispatchRoverMission,
  harvestCropBay,
  loadSimulationFromStorage,
  plantCropInBay,
  rebalanceBatteryBank,
  repairGreenhouse,
  repairLifeSupportEquipment,
  repairRoverMobility,
  returnRoverToBase,
  saveSimulationToStorage,
  setCrewActivity,
  setElectrolysisMode,
  setGreenhouseLighting,
  setGreenhouseNutrientMode,
  setLoadPriorityPreset,
  toggleCo2Scrubber,
  toggleEmergencyOxygen,
  toggleRadiationShelter,
  toggleRoverCharging,
  toggleWaterRecycler,
} from '../simulation/engine';
import { advanceSimulation } from '../simulation/time';
import type {
  CrewActivityLevel,
  CropType,
  ElectrolysisMode,
  LightingLevel,
  MissionConfig,
  NutrientMode,
  RouteRiskProfile,
  SimulationState,
} from '../simulation/types';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => {
    return loadSimulationFromStorage() ?? createInitialState();
  });

  // Persist to LocalStorage whenever state changes
  useEffect(() => {
    saveSimulationToStorage(state);
  }, [state]);

  // Real-time playback timer when not paused
  useEffect(() => {
    if (state.paused || state.phase !== 'active') return;
    const timer = window.setInterval(() => {
      setState((prev) => {
        if (prev.paused || prev.phase !== 'active') return prev;
        const result = advanceSimulation(prev, 1);
        return result.state;
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [state.paused, state.phase]);

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;
      return { ...prev, paused: !prev.paused, pauseReason: null };
    });
  }, []);

  const stepHours = useCallback((hours: number) => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;
      const result = advanceSimulation(prev, hours);
      return result.state;
    });
  }, []);

  const startNewMission = useCallback((configOverrides?: Partial<MissionConfig>) => {
    clearSimulationStorage();
    setState(createInitialState(configOverrides));
  }, []);

  const dismissPauseBanner = useCallback(() => {
    setState((prev) => ({ ...prev, pauseReason: null }));
  }, []);

  const actions = {
    togglePause,
    stepHours,
    startNewMission,
    dismissPauseBanner,
    setCrewActivity: (activity: CrewActivityLevel) =>
      setState((prev) => setCrewActivity(prev, activity)),
    setElectrolysisMode: (mode: ElectrolysisMode) =>
      setState((prev) => setElectrolysisMode(prev, mode)),
    toggleCo2Scrubber: () => setState((prev) => toggleCo2Scrubber(prev)),
    toggleWaterRecycler: () => setState((prev) => toggleWaterRecycler(prev)),
    toggleEmergencyOxygen: () => setState((prev) => toggleEmergencyOxygen(prev)),
    repairLifeSupport: (target: 'scrubber' | 'recycler') =>
      setState((prev) => repairLifeSupportEquipment(prev, target)),
    cleanSolarArrays: () => setState((prev) => cleanSolarArrays(prev)),
    rebalanceBattery: () => setState((prev) => rebalanceBatteryBank(prev)),
    setLoadPriorityPreset: (
      preset: 'life-first' | 'agriculture-boost' | 'rover-ops'
    ) => setState((prev) => setLoadPriorityPreset(prev, preset)),
    adjustWaterWall: (delta: number) =>
      setState((prev) => adjustWaterWallShielding(prev, delta)),
    addRegolithShielding: () => setState((prev) => addRegolithShielding(prev)),
    toggleRadiationShelter: () => setState((prev) => toggleRadiationShelter(prev)),
    plantCrop: (bayId: number, cropType: CropType) =>
      setState((prev) => plantCropInBay(prev, bayId, cropType)),
    harvestCrop: (bayId: number) => setState((prev) => harvestCropBay(prev, bayId)),
    clearCrop: (bayId: number) => setState((prev) => clearCropBay(prev, bayId)),
    setGreenhouseLighting: (level: LightingLevel) =>
      setState((prev) => setGreenhouseLighting(prev, level)),
    setGreenhouseNutrientMode: (mode: NutrientMode) =>
      setState((prev) => setGreenhouseNutrientMode(prev, mode)),
    repairGreenhouse: () => setState((prev) => repairGreenhouse(prev)),
    dispatchRover: (waypointId: string, route: RouteRiskProfile) =>
      setState((prev) => dispatchRoverMission(prev, waypointId, route)),
    collectSample: () => setState((prev) => collectRoverSample(prev)),
    returnRover: () => setState((prev) => returnRoverToBase(prev)),
    toggleRoverCharging: () => setState((prev) => toggleRoverCharging(prev)),
    repairRoverMobility: () => setState((prev) => repairRoverMobility(prev)),
  };

  return { state, actions };
}
