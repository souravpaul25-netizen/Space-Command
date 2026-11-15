import type { HandbookSectionId } from '../data/handbookContent';
import { RoverModule } from '../modules/rover/RoverModule';
import type { RouteRiskProfile, SimulationState } from '../simulation/types';

interface LunarSurfacePageProps {
  state: SimulationState;
  onDispatch: (waypointId: string, route: RouteRiskProfile) => void;
  onCollectSample: () => void;
  onReturnToBase: () => void;
  onToggleCharging: () => void;
  onRepairMobility: () => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function LunarSurfacePage({
  state,
  onDispatch,
  onCollectSample,
  onReturnToBase,
  onToggleCharging,
  onRepairMobility,
  onOpenHandbook,
}: LunarSurfacePageProps) {
  return (
    <RoverModule
      state={state}
      onDispatch={onDispatch}
      onCollectSample={onCollectSample}
      onReturnToBase={onReturnToBase}
      onToggleCharging={onToggleCharging}
      onRepairMobility={onRepairMobility}
      onOpenHandbook={onOpenHandbook}
    />
  );
}
