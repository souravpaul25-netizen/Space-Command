import {
  Compass,
  LayoutDashboard,
  ShieldAlert,
  Sprout,
  Wind,
  Zap,
} from 'lucide-react';
import type { AppScreen, SimulationState, SubsystemId } from '../simulation/types';

interface MobileBottomNavProps {
  activeScreen: AppScreen;
  activeSubsystem: SubsystemId;
  state: SimulationState;
  onSelectOverview: () => void;
  onSelectSubsystem: (sub: SubsystemId) => void;
  onSelectRover: () => void;
}

type TabKey = 'overview' | 'life-support' | 'power' | 'radiation' | 'agriculture' | 'rover';

export function MobileBottomNav({
  activeScreen,
  activeSubsystem,
  state,
  onSelectOverview,
  onSelectSubsystem,
  onSelectRover,
}: MobileBottomNavProps) {
  const activeKey: TabKey | null =
    activeScreen === 'mission-control'
      ? 'overview'
      : activeScreen === 'lunar-surface' ||
        (activeScreen === 'subsystems' && activeSubsystem === 'rover')
      ? 'rover'
      : activeScreen === 'subsystems'
      ? activeSubsystem
      : null;

  const alertLevelFor = (key: TabKey): 'critical' | 'warning' | null => {
    if (key === 'life-support') {
      if (state.co2Ppm >= 10000 || state.oxygenKg < 10) return 'critical';
      if (state.co2Ppm >= 3500 || state.co2ScrubberHealthPct < 75 || state.waterLitres < 25)
        return 'warning';
    }
    if (key === 'power') {
      if (state.batteryKwh < 15) return 'critical';
      if (state.powerDeficitKw > 0.2 || state.solarDustLossPct > 18) return 'warning';
    }
    if (key === 'radiation') {
      if (state.eventRadiationMsvPerHour > 0 && !state.shielding.inShelter) return 'critical';
      if (state.cumulativeRadiationMsv > 50 || state.eventRadiationMsvPerHour > 0) return 'warning';
    }
    if (key === 'agriculture') {
      if (state.packagedFoodKg < 8) return 'critical';
      if (state.cropBays.some((b) => b.status === 'failed')) return 'warning';
    }
    if (key === 'rover') {
      if (state.rover.status === 'stranded') return 'critical';
      if (state.rover.mobilityHealthPct < 60) return 'warning';
    }
    if (key === 'overview') {
      const hasCrit = state.alerts.some((a) => !a.resolved && a.severity === 'critical');
      const hasWarn = state.alerts.some((a) => !a.resolved && a.severity === 'warning');
      if (hasCrit) return 'critical';
      if (hasWarn) return 'warning';
    }
    return null;
  };

  const tabs: Array<{
    key: TabKey;
    mobileLabel: string;
    tabletLabel: string;
    ariaLabel: string;
    icon: typeof LayoutDashboard;
    onPress: () => void;
  }> = [
    {
      key: 'overview',
      mobileLabel: 'Overview',
      tabletLabel: 'Overview',
      ariaLabel: 'Mission Overview',
      icon: LayoutDashboard,
      onPress: onSelectOverview,
    },
    {
      key: 'life-support',
      mobileLabel: 'Air',
      tabletLabel: 'Life Support',
      ariaLabel: 'Life Support & Atmosphere',
      icon: Wind,
      onPress: () => onSelectSubsystem('life-support'),
    },
    {
      key: 'power',
      mobileLabel: 'Power',
      tabletLabel: 'Power',
      ariaLabel: 'Surface Power & Grid',
      icon: Zap,
      onPress: () => onSelectSubsystem('power'),
    },
    {
      key: 'radiation',
      mobileLabel: 'Rad',
      tabletLabel: 'Radiation',
      ariaLabel: 'Radiation Protection',
      icon: ShieldAlert,
      onPress: () => onSelectSubsystem('radiation'),
    },
    {
      key: 'agriculture',
      mobileLabel: 'Crops',
      tabletLabel: 'Greenhouse',
      ariaLabel: 'Greenhouse & Food',
      icon: Sprout,
      onPress: () => onSelectSubsystem('agriculture'),
    },
    {
      key: 'rover',
      mobileLabel: 'Rover',
      tabletLabel: 'Rover',
      ariaLabel: 'Lunar Rover Operations',
      icon: Compass,
      onPress: onSelectRover,
    },
  ];

  return (
    <nav
      aria-label="Game Subsystem Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0A0F1D]/95 backdrop-blur-md pb-safe"
    >
      <div className="grid grid-cols-6 max-w-3xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          const badge = alertLevelFor(tab.key);
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={tab.onPress}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-[54px] px-0.5 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400 ${
                isActive
                  ? 'text-cyan-300 bg-cyan-950/30 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 border-t-2 border-transparent'
              }`}
            >
              <div className="relative">
                <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {badge && (
                  <span
                    aria-hidden="true"
                    className={`absolute -top-1 -right-1.5 w-2 h-2 rounded-full ring-2 ring-[#0A0F1D] ${
                      badge === 'critical' ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                  />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium leading-tight tracking-tight truncate max-w-full">
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.tabletLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
