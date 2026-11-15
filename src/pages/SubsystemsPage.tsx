import type { HandbookSectionId } from '../data/handbookContent';
import { AgricultureModule } from '../modules/agriculture/AgricultureModule';
import { LifeSupportModule } from '../modules/life-support/LifeSupportModule';
import { SurfacePowerModule } from '../modules/power/SurfacePowerModule';
import { RadiationModule } from '../modules/radiation/RadiationModule';
import { RoverModule } from '../modules/rover/RoverModule';
import type {
  CrewActivityLevel,
  CropType,
  ElectrolysisMode,
  LightingLevel,
  NutrientMode,
  RouteRiskProfile,
  SimulationState,
  SubsystemId,
} from '../simulation/types';

interface SubsystemsPageProps {
  state: SimulationState;
  activeSubsystem: SubsystemId;
  onSelectSubsystem: (sub: SubsystemId) => void;
  onOpenHandbook: (section: HandbookSectionId) => void;
  actions: {
    setCrewActivity: (activity: CrewActivityLevel) => void;
    setElectrolysisMode: (mode: ElectrolysisMode) => void;
    toggleCo2Scrubber: () => void;
    toggleWaterRecycler: () => void;
    toggleEmergencyOxygen: () => void;
    repairLifeSupport: (target: 'scrubber' | 'recycler') => void;
    cleanSolarArrays: () => void;
    rebalanceBattery: () => void;
    setLoadPriorityPreset: (
      preset: 'life-first' | 'agriculture-boost' | 'rover-ops'
    ) => void;
    adjustWaterWall: (delta: number) => void;
    addRegolithShielding: () => void;
    toggleRadiationShelter: () => void;
    plantCrop: (bayId: number, cropType: CropType) => void;
    harvestCrop: (bayId: number) => void;
    clearCrop: (bayId: number) => void;
    setGreenhouseLighting: (level: LightingLevel) => void;
    setGreenhouseNutrientMode: (mode: NutrientMode) => void;
    repairGreenhouse: () => void;
    dispatchRover: (waypointId: string, route: RouteRiskProfile) => void;
    collectSample: () => void;
    returnRover: () => void;
    toggleRoverCharging: () => void;
    repairRoverMobility: () => void;
  };
}

const SUBSYSTEM_TABS: Array<{ id: SubsystemId; label: string }> = [
  { id: 'life-support', label: '01. Life Support' },
  { id: 'power', label: '02. Surface Power' },
  { id: 'radiation', label: '03. Radiation Safety' },
  { id: 'agriculture', label: '04. Food & Water' },
  { id: 'rover', label: '05. Rover Ops' },
];

export function SubsystemsPage({
  state,
  activeSubsystem,
  onSelectSubsystem,
  onOpenHandbook,
  actions,
}: SubsystemsPageProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Segmented Subsystem Selector (Desktop lg+; Mobile uses Bottom Game Nav) */}
      <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-md border border-slate-800 bg-[#0A0F1D] overflow-x-auto">
        {SUBSYSTEM_TABS.map((tab) => {
          const isActive = activeSubsystem === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectSubsystem(tab.id)}
              className={`min-h-[44px] sm:min-h-0 px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-100 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Selected Module */}
      {activeSubsystem === 'life-support' && (
        <LifeSupportModule
          state={state}
          onSetCrewActivity={actions.setCrewActivity}
          onSetElectrolysisMode={actions.setElectrolysisMode}
          onToggleScrubber={actions.toggleCo2Scrubber}
          onToggleRecycler={actions.toggleWaterRecycler}
          onToggleEmergencyO2={actions.toggleEmergencyOxygen}
          onRepair={actions.repairLifeSupport}
          onOpenHandbook={onOpenHandbook}
        />
      )}
      {activeSubsystem === 'power' && (
        <SurfacePowerModule
          state={state}
          onCleanSolarArrays={actions.cleanSolarArrays}
          onRebalanceBattery={actions.rebalanceBattery}
          onSetPriorityPreset={actions.setLoadPriorityPreset}
          onOpenHandbook={onOpenHandbook}
        />
      )}
      {activeSubsystem === 'radiation' && (
        <RadiationModule
          state={state}
          onAdjustWaterWall={actions.adjustWaterWall}
          onAddRegolith={actions.addRegolithShielding}
          onToggleShelter={actions.toggleRadiationShelter}
          onOpenHandbook={onOpenHandbook}
        />
      )}
      {activeSubsystem === 'agriculture' && (
        <AgricultureModule
          state={state}
          onPlantCrop={actions.plantCrop}
          onHarvestCrop={actions.harvestCrop}
          onClearCrop={actions.clearCrop}
          onSetLighting={actions.setGreenhouseLighting}
          onSetNutrientMode={actions.setGreenhouseNutrientMode}
          onRepairGreenhouse={actions.repairGreenhouse}
          onOpenHandbook={onOpenHandbook}
        />
      )}
      {activeSubsystem === 'rover' && (
        <RoverModule
          state={state}
          onDispatch={actions.dispatchRover}
          onCollectSample={actions.collectSample}
          onReturnToBase={actions.returnRover}
          onToggleCharging={actions.toggleRoverCharging}
          onRepairMobility={actions.repairRoverMobility}
          onOpenHandbook={onOpenHandbook}
        />
      )}
    </div>
  );
}
