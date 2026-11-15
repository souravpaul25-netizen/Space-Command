import { useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Droplets,
  FileBarChart2,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Utensils,
  Wind,
  X,
} from 'lucide-react';
import { LUNAR_SITE_PROFILES } from '../simulation/config';
import { formatMissionTime } from '../simulation/time';
import type { AppScreen, SimulationState, SubsystemId } from '../simulation/types';
import { StatusIndicator } from './StatusIndicator';

interface MobileGameHUDProps {
  activeScreen: AppScreen;
  state: SimulationState;
  onSelectScreen: (screen: AppScreen) => void;
  onNavigateSubsystem: (sub: SubsystemId) => void;
  onTogglePause: () => void;
  onStepHours: (hours: number) => void;
  onRequestNewMission: () => void;
  onReplayTutorial: () => void;
}

export function MobileGameHUD({
  activeScreen,
  state,
  onSelectScreen,
  onNavigateSubsystem,
  onTogglePause,
  onStepHours,
  onRequestNewMission,
  onReplayTutorial,
}: MobileGameHUDProps) {
  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const timeInfo = formatMissionTime(state.hour);
  const site = LUNAR_SITE_PROFILES[state.config.siteId];

  const o2Pct = Math.min(100, (state.oxygenKg / state.config.maxOxygenKg) * 100);
  const waterPct = Math.min(100, (state.waterLitres / state.config.maxWaterLitres) * 100);
  const foodPct = Math.min(100, (state.packagedFoodKg / Math.max(1, state.config.initialFoodKg)) * 100);
  const batteryPct = Math.min(
    100,
    (state.batteryKwh / Math.max(1, state.batteryMaxEffectiveKwh)) * 100
  );

  const activeAlerts = state.alerts.filter((a) => !a.resolved);
  const topAlert =
    activeAlerts.find((a) => a.severity === 'critical') ?? activeAlerts[0] ?? null;

  const hasCritical =
    state.phase === 'failed' ||
    state.co2Ppm >= 10000 ||
    state.oxygenKg < 8 ||
    state.waterLitres < 20 ||
    state.activeEvents.some((e) => e.active && e.severity === 'critical');

  const hasWarning =
    !hasCritical &&
    (state.powerDeficitKw > 0.2 ||
      state.co2Ppm >= 3500 ||
      activeAlerts.some((a) => a.severity === 'warning'));

  const overallLevel = hasCritical ? 'critical' : hasWarning ? 'warning' : 'nominal';
  const overallLabel =
    state.phase === 'failed'
      ? 'Failed'
      : state.phase === 'completed'
      ? 'Complete'
      : hasCritical
      ? 'Critical'
      : hasWarning
      ? 'Caution'
      : 'Nominal';

  const netPowerKw = state.solarGenerationKw - state.totalPowerDemandKw;

  const jumpToAlertTarget = () => {
    if (!topAlert || topAlert.subsystem === 'mission') {
      onSelectScreen('mission-control');
      return;
    }
    if (topAlert.subsystem === 'rover') {
      onSelectScreen('lunar-surface');
    } else {
      onNavigateSubsystem(topAlert.subsystem);
    }
  };

  return (
    <div className="lg:hidden border-b border-slate-800 bg-[#0A0F1D] pt-safe">
      {/* Compact Console Top Row */}
      <header className="px-3 h-12 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectScreen('mission-control')}
          className="flex items-center gap-2 min-w-0 text-left cursor-pointer rounded py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <span className="text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            Space Command
          </span>
          <span className="font-mono tabular-nums text-[11px] text-cyan-300 whitespace-nowrap">
            D{String(timeInfo.day).padStart(2, '0')} · {String(timeInfo.hourOfDay).padStart(2, '0')}:00
          </span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectScreen('handbook')}
            aria-label="Mission Handbook"
            className={`min-w-[44px] min-h-[44px] px-2.5 inline-flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              activeScreen === 'handbook'
                ? 'border-cyan-400 bg-cyan-950/35 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Handbook</span>
          </button>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Open Mission Menu"
            aria-expanded={moreOpen}
            className="min-w-[44px] min-h-[44px] px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline text-xs font-medium">Menu</span>
          </button>
        </div>
      </header>

      {/* Persistent Compact Game HUD */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-[#070B14] space-y-2">
        {/* 4 Essential Resource Gauges */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Oxygen */}
          <div
            className={`px-2 py-1.5 rounded border bg-[#0D1322] ${
              state.oxygenKg < 10
                ? 'border-rose-500/60'
                : state.oxygenKg < 25
                ? 'border-amber-500/50'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Wind className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>O₂</span>
              </span>
              <span className="font-mono tabular-nums text-slate-100 font-semibold">
                {state.oxygenKg.toFixed(0)}k
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${
                  state.oxygenKg < 10
                    ? 'bg-rose-500'
                    : state.oxygenKg < 25
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${o2Pct}%` }}
              />
            </div>
          </div>

          {/* Water */}
          <div
            className={`px-2 py-1.5 rounded border bg-[#0D1322] ${
              state.waterLitres < 25
                ? 'border-rose-500/60'
                : state.waterLitres < 60
                ? 'border-amber-500/50'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Droplets className="w-3 h-3 text-blue-400 shrink-0" />
                <span>H₂O</span>
              </span>
              <span className="font-mono tabular-nums text-slate-100 font-semibold">
                {state.waterLitres.toFixed(0)}L
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${
                  state.waterLitres < 25
                    ? 'bg-rose-500'
                    : state.waterLitres < 60
                    ? 'bg-amber-400'
                    : 'bg-blue-400'
                }`}
                style={{ width: `${waterPct}%` }}
              />
            </div>
          </div>

          {/* Food */}
          <div
            className={`px-2 py-1.5 rounded border bg-[#0D1322] ${
              state.packagedFoodKg < 8
                ? 'border-rose-500/60'
                : state.packagedFoodKg < 20
                ? 'border-amber-500/50'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Utensils className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Food</span>
              </span>
              <span className="font-mono tabular-nums text-slate-100 font-semibold">
                {state.packagedFoodKg.toFixed(0)}k
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${
                  state.packagedFoodKg < 8
                    ? 'bg-rose-500'
                    : state.packagedFoodKg < 20
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${foodPct}%` }}
              />
            </div>
          </div>

          {/* Battery & Net Power */}
          <div
            className={`px-2 py-1.5 rounded border bg-[#0D1322] ${
              batteryPct < 18
                ? 'border-rose-500/60'
                : state.powerDeficitKw > 0.2 || batteryPct < 40
                ? 'border-amber-500/50'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-0.5 font-medium">
                <BatteryCharging className="w-3 h-3 text-amber-300 shrink-0" />
                <span>Batt</span>
              </span>
              <span className="font-mono tabular-nums text-slate-100 font-semibold">
                {batteryPct.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${
                  batteryPct < 18
                    ? 'bg-rose-500'
                    : batteryPct < 40
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${batteryPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Crew Status + Secondary Toggle + Compact Time Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="min-h-[44px] px-2 py-1 -ml-1 rounded-lg flex items-center gap-1.5 text-left hover:bg-slate-900/70 cursor-pointer min-w-0"
          >
            <StatusIndicator level={overallLevel} label={overallLabel} />
            <span className="text-[11px] font-mono tabular-nums text-slate-300 truncate">
              Crew {state.crewHealthPct.toFixed(0)}%
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {/* Time Progression Steppers */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={state.phase !== 'active'}
              onClick={onTogglePause}
              aria-label={state.paused ? 'Resume mission simulation' : 'Pause mission simulation'}
              className={`min-w-[44px] min-h-[44px] px-2.5 rounded-lg border inline-flex items-center justify-center gap-1 text-xs font-medium disabled:opacity-40 cursor-pointer transition-transform active:scale-95 ${
                state.paused
                  ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300'
                  : 'border-amber-500/50 bg-amber-950/30 text-amber-300'
              }`}
            >
              {state.paused ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{state.paused ? 'Play' : 'Pause'}</span>
            </button>

            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 divide-x divide-slate-800 overflow-hidden">
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(1)}
                className="min-h-[44px] min-w-[40px] px-2 inline-flex items-center justify-center gap-0.5 text-[11px] font-mono tabular-nums text-slate-200 hover:bg-slate-800 active:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Advance 1 hour"
              >
                <StepForward className="w-3 h-3 hidden sm:inline" />
                <span>+1h</span>
              </button>
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(6)}
                className="min-h-[44px] min-w-[40px] px-2 inline-flex items-center justify-center text-[11px] font-mono tabular-nums text-slate-200 hover:bg-slate-800 active:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Advance 6 hours"
              >
                +6h
              </button>
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(24)}
                className="min-h-[44px] min-w-[40px] px-2 inline-flex items-center justify-center text-[11px] font-mono tabular-nums text-slate-200 hover:bg-slate-800 active:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Advance 1 day"
              >
                +1d
              </button>
            </div>
          </div>
        </div>

        {/* Clickable Critical/Warning Strip */}
        {topAlert && (
          <button
            type="button"
            onClick={jumpToAlertTarget}
            className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-left text-[11px] cursor-pointer transition-colors ${
              topAlert.severity === 'critical'
                ? 'border-rose-500/50 bg-rose-950/35 text-rose-200'
                : 'border-amber-500/45 bg-amber-950/25 text-amber-200'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">
                {topAlert.title}
                {activeAlerts.length > 1 ? ` (+${activeAlerts.length - 1} more)` : ''}
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide shrink-0 underline">
              Inspect
            </span>
          </button>
        )}

        {/* Expandable Secondary Telemetry Drawer */}
        {expanded && (
          <div className="p-2.5 rounded-lg border border-slate-800 bg-[#0D1322] grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
            <div>
              <span className="text-slate-400 block">CO₂ Level</span>
              <span className={state.co2Ppm >= 3500 ? 'text-amber-300' : 'text-slate-100'}>
                {state.co2Ppm.toLocaleString()} ppm
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Power Net</span>
              <span className={netPowerKw < 0 ? 'text-amber-300' : 'text-emerald-300'}>
                {netPowerKw >= 0 ? '+' : ''}
                {netPowerKw.toFixed(1)} kW ({state.solarGenerationKw.toFixed(1)}kW sun)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Radiation Dose</span>
              <span className={state.cumulativeRadiationMsv >= 50 ? 'text-amber-300' : 'text-slate-100'}>
                {state.cumulativeRadiationMsv.toFixed(1)} mSv ·{' '}
                {state.shielding.inShelter ? 'Sheltered' : 'Main Hab'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Crew Morale</span>
              <span className="text-slate-100 capitalize">
                {state.crewMoralePct.toFixed(0)}% · {state.config.crewSize} crew ({state.crewActivity})
              </span>
            </div>
            <div className="col-span-2 sm:col-span-2 text-slate-400 font-sans">
              Site: <span className="text-slate-200">{site.name}</span> ·{' '}
              {Math.round(state.solarIlluminationFactor * 100)}% sun
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet "More" Menu Drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Mission Utility Menu"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl border-t border-x border-slate-700 bg-[#0B1120] p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1" />

            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Command Options</h2>
                <p className="text-xs text-slate-400">
                  Day {timeInfo.day} / {state.config.missionDurationDays} · {site.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSelectScreen('mission-report');
                }}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-left text-sm font-medium cursor-pointer ${
                  activeScreen === 'mission-report'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-100 hover:border-slate-700'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <FileBarChart2 className="w-4 h-4 text-cyan-400" />
                  <span>Engineering Mission Report</span>
                </span>
                <span className="text-xs font-mono text-slate-400">Score & Log</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onSelectScreen('handbook');
                }}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-left text-sm font-medium cursor-pointer ${
                  activeScreen === 'handbook'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/60 text-slate-100 hover:border-slate-700'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Mission Handbook</span>
                </span>
                <span className="text-xs font-mono text-slate-400">12 Chapters</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onReplayTutorial();
                }}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 hover:border-slate-700 flex items-center justify-between text-left text-sm font-medium cursor-pointer"
              >
                <span className="inline-flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Replay Commander Tutorial</span>
                </span>
                <span className="text-xs font-mono text-slate-400">5 Steps</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onRequestNewMission();
                }}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Configure New Mission</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
