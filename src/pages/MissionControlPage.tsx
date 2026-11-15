import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  StepForward,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatusIndicator } from '../components/StatusIndicator';
import { TelemetryMetric } from '../components/TelemetryMetric';
import {
  LUNAR_SITE_PROFILES,
  ROVER_WAYPOINTS,
  SCIENTIFIC_ASSUMPTIONS,
} from '../simulation/config';
import { formatMissionTime } from '../simulation/time';
import type {
  AppScreen,
  SimulationState,
  SubsystemId,
} from '../simulation/types';

interface MissionControlPageProps {
  state: SimulationState;
  onNavigateSubsystem: (sub: SubsystemId) => void;
  onNavigateScreen: (screen: AppScreen) => void;
  onTogglePause: () => void;
  onStepHours: (hours: number) => void;
}

export function MissionControlPage({
  state,
  onNavigateSubsystem,
  onNavigateScreen,
  onTogglePause,
  onStepHours,
}: MissionControlPageProps) {
  const [showSubsystemsMobile, setShowSubsystemsMobile] = useState(true);
  const [showChartMobile, setShowChartMobile] = useState(false);

  const missionPct = Math.min(
    100,
    Math.round((state.hour / (state.config.missionDurationDays * 24)) * 100)
  );
  const site = LUNAR_SITE_PROFILES[state.config.siteId];
  const timeInfo = formatMissionTime(state.hour);

  const activeAlerts = state.alerts.filter((a) => !a.resolved);
  const chartData = state.telemetry.slice(-72);

  const o2Pct = (state.oxygenKg / state.config.maxOxygenKg) * 100;
  const batteryPct = (state.batteryKwh / state.batteryMaxEffectiveKwh) * 100;
  const waterPct = (state.waterLitres / state.config.maxWaterLitres) * 100;

  const activeCropsCount = state.cropBays.filter(
    (b) => b.status === 'growing' || b.status === 'ready'
  ).length;

  const objectives: Array<{
    id: string;
    title: string;
    progressText: string;
    pct: number;
    done: boolean;
    targetSub: SubsystemId | 'rover';
  }> = [
    {
      id: 'obj-endurance',
      title: `Sustain ${state.config.crewSize}-Crew Outpost`,
      progressText: `Day ${timeInfo.day}/${state.config.missionDurationDays}`,
      pct: missionPct,
      done: state.phase === 'completed',
      targetSub: 'life-support',
    },
    {
      id: 'obj-rad',
      title: 'Radiation Safety (< 50 mSv)',
      progressText: `${state.cumulativeRadiationMsv.toFixed(1)} / ${SCIENTIFIC_ASSUMPTIONS.radiation.careerCautionMsv} mSv`,
      pct: Math.min(
        100,
        (state.cumulativeRadiationMsv / SCIENTIFIC_ASSUMPTIONS.radiation.careerCautionMsv) * 100
      ),
      done:
        state.phase === 'completed' &&
        state.cumulativeRadiationMsv < SCIENTIFIC_ASSUMPTIONS.radiation.careerCautionMsv,
      targetSub: 'radiation',
    },
    {
      id: 'obj-crops',
      title: 'Greenhouse Food Supplement',
      progressText: `${state.greenhouseFoodProducedKg.toFixed(1)} kg · ${activeCropsCount}/3 bays`,
      pct: Math.min(100, (state.greenhouseFoodProducedKg / 10) * 100),
      done: state.greenhouseFoodProducedKg >= 10,
      targetSub: 'agriculture',
    },
    {
      id: 'obj-rover',
      title: 'Survey Lunar Sites & Ice',
      progressText: `${state.rover.visitedWaypointIds.length}/${ROVER_WAYPOINTS.length} sites · ${state.rover.discoveredIceSites.length} ice`,
      pct: (state.rover.visitedWaypointIds.length / ROVER_WAYPOINTS.length) * 100,
      done: state.rover.visitedWaypointIds.length >= ROVER_WAYPOINTS.length,
      targetSub: 'rover',
    },
  ];

  const subsystemSummary: Array<{
    id: SubsystemId;
    name: string;
    shortName: string;
    metric: string;
    level: 'nominal' | 'warning' | 'critical';
    statusText: string;
  }> = [
    {
      id: 'life-support',
      name: '01. Life Support & Atmosphere',
      shortName: 'Life Support',
      metric: `${state.oxygenKg.toFixed(1)} kg O₂ · ${state.co2Ppm} ppm CO₂`,
      level:
        state.co2Ppm >= 10000 || state.oxygenKg < 10
          ? 'critical'
          : state.co2Ppm >= 3500 || state.co2ScrubberHealthPct < 75
          ? 'warning'
          : 'nominal',
      statusText:
        state.co2Ppm >= 10000 || state.oxygenKg < 10
          ? 'Critical'
          : state.co2Ppm >= 3500
          ? 'Caution'
          : 'Nominal',
    },
    {
      id: 'power',
      name: '02. Surface Power & Grid',
      shortName: 'Power Grid',
      metric: `${state.solarGenerationKw.toFixed(1)} kW solar · ${state.batteryKwh.toFixed(0)} kWh batt`,
      level:
        state.batteryKwh < 15
          ? 'critical'
          : state.powerDeficitKw > 0.2 || state.solarDustLossPct > 18
          ? 'warning'
          : 'nominal',
      statusText:
        state.batteryKwh < 15
          ? 'Low Reserve'
          : state.powerDeficitKw > 0.2
          ? 'Shedding'
          : 'Balanced',
    },
    {
      id: 'radiation',
      name: '03. Radiation Protection',
      shortName: 'Radiation',
      metric: `${state.cumulativeRadiationMsv.toFixed(1)} mSv · ${state.shielding.inShelter ? 'Sheltered' : 'Main Hab'}`,
      level:
        state.eventRadiationMsvPerHour > 0 && !state.shielding.inShelter
          ? 'critical'
          : state.cumulativeRadiationMsv > 50 || state.eventRadiationMsvPerHour > 0
          ? 'warning'
          : 'nominal',
      statusText:
        state.eventRadiationMsvPerHour > 0 && !state.shielding.inShelter
          ? 'Shelter Needed'
          : state.eventRadiationMsvPerHour > 0
          ? 'SPE Active'
          : 'Protected',
    },
    {
      id: 'agriculture',
      name: '04. Food & Water Recycling',
      shortName: 'Greenhouse',
      metric: `${state.packagedFoodKg.toFixed(1)} kg food · ${state.waterLitres.toFixed(0)} L water`,
      level:
        state.packagedFoodKg < 8 || state.waterLitres < 25
          ? 'critical'
          : state.cropBays.some((b) => b.status === 'failed') || state.waterLitres < 60
          ? 'warning'
          : 'nominal',
      statusText: state.cropBays.some((b) => b.status === 'ready')
        ? 'Harvest Ready'
        : state.packagedFoodKg < 8
        ? 'Low Rations'
        : 'Growing',
    },
    {
      id: 'rover',
      name: '05. Lunar Rover Ops',
      shortName: 'Lunar Rover',
      metric: `${state.rover.visitedWaypointIds.length}/${ROVER_WAYPOINTS.length} sites · ${state.rover.batteryKwh.toFixed(0)} kWh`,
      level:
        state.rover.status === 'stranded'
          ? 'critical'
          : state.rover.mobilityHealthPct < 60
          ? 'warning'
          : 'nominal',
      statusText:
        state.rover.status === 'stranded'
          ? 'Stranded'
          : state.rover.status === 'docked'
          ? 'Docked'
          : 'On Traverse',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mission Timeline Progress Header + Mobile Primary Game CTA */}
      <section className="p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-slate-100 leading-snug">
              Outpost Overview · {site.name}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
              {site.coordinates} · {state.config.crewSize} Astronauts · {state.config.missionDurationDays}-Day Mission
            </p>
          </div>
          <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
            <span className="text-xs sm:text-sm font-semibold text-cyan-300">
              {missionPct}% Complete
            </span>
            <span className="block text-[11px] sm:text-xs text-slate-400">
              Hour {state.hour} / {state.config.missionDurationDays * 24}
            </span>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all"
            style={{ width: `${missionPct}%` }}
          />
        </div>

        {/* Mobile Game Quick-Resume & Advance Bar (< lg) */}
        {state.phase === 'active' && (
          <div className="lg:hidden grid grid-cols-5 gap-2 pt-1">
            <button
              type="button"
              onClick={onTogglePause}
              className={`col-span-3 min-h-[46px] px-3 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer ${
                state.paused
                  ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                  : 'border border-amber-400/60 bg-amber-950/40 text-amber-200'
              }`}
            >
              {state.paused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{state.hour === 0 ? 'Start Simulation' : 'Continue Mission'}</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Clock</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onStepHours(6)}
              className="col-span-2 min-h-[46px] px-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 hover:border-cyan-400 text-xs font-mono font-medium inline-flex items-center justify-center gap-1 active:scale-[0.98] cursor-pointer"
            >
              <StepForward className="w-3.5 h-3.5 text-cyan-400" />
              <span>+6h Jump</span>
            </button>
          </div>
        )}
      </section>

      {/* Top Resource Dashboard Strip (2x2 compact grid on smartphone, 4-col on desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Crew Health"
          value={state.crewHealthPct.toFixed(0)}
          unit="%"
          progressPct={state.crewHealthPct}
          delta={`Morale ${state.crewMoralePct.toFixed(0)}% · ${state.crewActivity}`}
          statusLevel={
            state.crewHealthPct < 50
              ? 'critical'
              : state.crewHealthPct < 80
              ? 'warning'
              : 'nominal'
          }
          statusLabel={state.crewHealthPct >= 80 ? 'Healthy' : 'Stressed'}
        />
        <TelemetryMetric
          label="Oxygen & CO₂"
          value={state.oxygenKg.toFixed(1)}
          unit="kg"
          progressPct={o2Pct}
          delta={`CO₂ ${state.co2Ppm.toLocaleString()} ppm · ${state.electrolysisMode}`}
          statusLevel={
            state.co2Ppm >= 10000 || state.oxygenKg < 10
              ? 'critical'
              : state.co2Ppm >= 3500
              ? 'warning'
              : 'nominal'
          }
          statusLabel={state.co2Ppm < 2500 ? 'Breathable' : 'Check CO₂'}
        />
        <TelemetryMetric
          label="Battery & Solar"
          value={state.batteryKwh.toFixed(0)}
          unit="kWh"
          progressPct={batteryPct}
          delta={`Sun ${state.solarGenerationKw.toFixed(1)}kW / Load ${state.totalPowerDemandKw.toFixed(1)}kW`}
          statusLevel={
            state.batteryKwh < 15
              ? 'critical'
              : state.powerDeficitKw > 0.2
              ? 'warning'
              : 'nominal'
          }
          statusLabel={state.powerDeficitKw > 0.2 ? 'Shedding' : 'Balanced'}
        />
        <TelemetryMetric
          label="Water & Food"
          value={state.waterLitres.toFixed(0)}
          unit="L"
          progressPct={waterPct}
          delta={`Food ${state.packagedFoodKg.toFixed(1)}kg · Rad ${state.cumulativeRadiationMsv.toFixed(1)}mSv`}
          statusLevel={
            state.waterLitres < 25 || state.packagedFoodKg < 8
              ? 'critical'
              : state.waterLitres < 60
              ? 'warning'
              : 'nominal'
          }
          statusLabel="Supplies"
        />
      </section>

      {/* Mission Objectives Tracker Card */}
      <section className="p-3.5 sm:p-4 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs sm:text-sm font-semibold text-slate-200">
            Active Mission Objectives
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Tap objective to open module
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {objectives.map((obj) => (
            <button
              key={obj.id}
              type="button"
              onClick={() =>
                obj.targetSub === 'rover'
                  ? onNavigateScreen('lunar-surface')
                  : onNavigateSubsystem(obj.targetSub)
              }
              className="min-h-[56px] p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-cyan-500/40 text-left space-y-1.5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-medium text-slate-100 truncate">
                  {obj.title}
                </span>
                {obj.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    obj.id === 'obj-rad' && state.cumulativeRadiationMsv >= 50
                      ? 'bg-amber-400'
                      : obj.done
                      ? 'bg-emerald-400'
                      : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, obj.pct))}%` }}
                />
              </div>
              <span className="block text-[11px] font-mono tabular-nums text-slate-400">
                {obj.progressText}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Workspace Split: Subsystem Matrix + Active Alerts & Telemetry Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left: Subsystem Status & Active Alerts */}
        <div className="lg:col-span-5 min-w-0 space-y-4 sm:space-y-6">
          {/* Active Mission Alerts (Elevated higher on mobile so emergencies show early) */}
          <div className="p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322]">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-semibold text-slate-200">
                Active Alerts & Warnings
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {activeAlerts.length} open
              </span>
            </div>
            {activeAlerts.length === 0 ? (
              <p className="text-xs text-slate-400">
                All subsystems nominal. No active warnings or maintenance alerts.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {activeAlerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusIndicator
                        level={alert.severity}
                        label={alert.title}
                      />
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        H{alert.hour}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">
                        {alert.actionHint}
                      </span>
                      {alert.subsystem !== 'mission' && (
                        <button
                          type="button"
                          onClick={() =>
                            alert.subsystem === 'rover'
                              ? onNavigateScreen('lunar-surface')
                              : onNavigateSubsystem(alert.subsystem as SubsystemId)
                          }
                          className="min-h-[40px] sm:min-h-0 px-3 sm:px-0 py-1 sm:py-0 rounded bg-cyan-950/30 sm:bg-transparent border border-cyan-500/30 sm:border-0 text-xs font-medium text-cyan-300 sm:text-cyan-400 hover:underline shrink-0 cursor-pointer"
                        >
                          Inspect →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Five Subsystems Navigation Matrix */}
          <div className="p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322]">
            <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Quick-Jump Subsystems
              </h2>
              <button
                type="button"
                onClick={() => setShowSubsystemsMobile((v) => !v)}
                aria-expanded={showSubsystemsMobile}
                className="md:hidden min-h-[40px] px-2.5 text-xs text-cyan-300 inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/60 cursor-pointer"
              >
                <span>{showSubsystemsMobile ? 'Hide' : 'Show'}</span>
                {showSubsystemsMobile ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className={`${showSubsystemsMobile ? 'block' : 'hidden'} md:block divide-y divide-slate-800/80`}>
              {subsystemSummary.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() =>
                    sub.id === 'rover'
                      ? onNavigateScreen('lunar-surface')
                      : onNavigateSubsystem(sub.id)
                  }
                  className="w-full min-h-[54px] py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-900/50 active:bg-slate-900 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-100">{sub.name}</p>
                    <p className="text-xs font-mono tabular-nums text-slate-400 mt-0.5 truncate">
                      {sub.metric}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIndicator level={sub.level} label={sub.statusText} />
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 md:hidden" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Multi-Channel System Telemetry Chart (collapsible on mobile) */}
        <div className="lg:col-span-7 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-200">
                Outpost Resource & Power Balance History
              </h2>
              <p className="text-xs text-slate-400">
                Tracks battery (kWh), solar (kW), oxygen (kg), and food (kg) over 72 hours.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChartMobile((v) => !v)}
              aria-expanded={showChartMobile}
              className="md:hidden min-h-[40px] px-3 text-xs text-cyan-300 inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/60 cursor-pointer shrink-0"
            >
              <span>{showChartMobile ? 'Hide Chart' : 'View Chart'}</span>
              {showChartMobile ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className={`${showChartMobile ? 'block' : 'hidden'} md:block space-y-4`}>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    stroke="#64748B"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    tickFormatter={(v) => `H${v}`}
                  />
                  <YAxis width={42} stroke="#94A3B8" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1120',
                      borderColor: '#334155',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="batteryKwh"
                    name="Battery (kWh)"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="oxygenKg"
                    name="Oxygen (kg)"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="foodKg"
                    name="Food (kg)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="solarPowerKw"
                    name="Solar Gen (kW)"
                    stroke="#60A5FA"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Engineering Interdependencies Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div>
                <p className="font-medium text-slate-200">Mass & Energy Coupling</p>
                <p className="mt-1 leading-relaxed">
                  O₂ electrolysis consumes water and electricity. Water recycling preserves both
                  hydration and electrolysis feedstock.
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-200">Safety vs. Productivity</p>
                <p className="mt-1 leading-relaxed">
                  During crater shadows or solar particle events, shed non-essential loads and
                  shelter crew before reserves collapse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
