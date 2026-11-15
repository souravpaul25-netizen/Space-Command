import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { InfoTooltip } from '../../components/InfoTooltip';
import { StatusIndicator } from '../../components/StatusIndicator';
import { TelemetryMetric } from '../../components/TelemetryMetric';
import type { HandbookSectionId } from '../../data/handbookContent';
import {
  LUNAR_SITE_PROFILES,
  SCIENTIFIC_ASSUMPTIONS,
} from '../../simulation/config';
import type { SimulationState } from '../../simulation/types';

interface SurfacePowerModuleProps {
  state: SimulationState;
  onCleanSolarArrays: () => void;
  onRebalanceBattery: () => void;
  onSetPriorityPreset: (
    preset: 'life-first' | 'agriculture-boost' | 'rover-ops'
  ) => void;
  onOpenHandbook?: (section: HandbookSectionId) => void;
}

export function SurfacePowerModule({
  state,
  onCleanSolarArrays,
  onRebalanceBattery,
  onSetPriorityPreset,
  onOpenHandbook,
}: SurfacePowerModuleProps) {
  const [showChartMobile, setShowChartMobile] = useState(false);

  const batteryPct = (state.batteryKwh / state.batteryMaxEffectiveKwh) * 100;
  const batteryLevel =
    batteryPct < 18 ? 'critical' : batteryPct < 40 ? 'warning' : 'nominal';

  const site = LUNAR_SITE_PROFILES[state.config.siteId];

  const forecastData = Array.from({ length: 25 }, (_, idx) => {
    const forecastHour = state.hour + idx * 3;
    const illum = site.getIllumination(forecastHour);
    const estKw = Number(
      (
        state.config.solarArrayPeakKw *
        illum *
        (1 - state.solarDustLossPct / 100)
      ).toFixed(2)
    );
    return {
      label: `+${idx * 3}h`,
      illuminationPct: Math.round(illum * 100),
      estSolarKw: estKw,
      demandKw: state.totalPowerDemandKw,
    };
  });

  const activePreset =
    state.priorities.agriculture === 2
      ? 'agriculture-boost'
      : state.priorities.roverDock === 3
      ? 'rover-ops'
      : 'life-first';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-slate-100">
            02. Surface Power & Grid
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 max-w-2xl">
            Balance photovoltaic generation, battery storage, and emergency load prioritization
            across lunar illumination cycles.
          </p>
        </div>
        <StatusIndicator
          level={state.powerDeficitKw > 0.2 ? 'warning' : 'nominal'}
          label={
            state.powerDeficitKw > 0.2
              ? `Load Shed (-${state.powerDeficitKw.toFixed(1)} kW)`
              : 'Grid Balanced'
          }
        />
      </div>

      {/* Primary KPI Strip (2x2 on smartphone) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <TelemetryMetric
          label="Solar Generation"
          value={state.solarGenerationKw.toFixed(2)}
          unit="kW"
          progressPct={state.solarIlluminationFactor * 100}
          delta={`${Math.round(state.solarIlluminationFactor * 100)}% sun · ${state.solarDustLossPct.toFixed(1)}% dust`}
          statusLevel={state.solarDustLossPct > 18 ? 'warning' : 'nominal'}
          statusLabel={state.solarDustLossPct > 18 ? 'Dusty' : 'Clear'}
        />
        <TelemetryMetric
          label="Grid Demand"
          value={state.totalPowerDemandKw.toFixed(2)}
          unit="kW"
          progressPct={Math.min(
            100,
            (state.totalPowerSuppliedKw / Math.max(0.1, state.totalPowerDemandKw)) * 100
          )}
          delta={`Supplied ${state.totalPowerSuppliedKw.toFixed(1)} kW · Loss ${state.lastHourBreakdown.conversionLossKw.toFixed(2)} kW`}
          statusLevel={state.powerDeficitKw > 0 ? 'warning' : 'nominal'}
          statusLabel={state.powerDeficitKw > 0 ? 'Deficit' : 'Met'}
        />
        <TelemetryMetric
          label="Battery Stored"
          value={state.batteryKwh.toFixed(1)}
          unit="kWh"
          progressPct={batteryPct}
          delta={`${batteryPct.toFixed(0)}% of ${state.batteryMaxEffectiveKwh.toFixed(0)} kWh · Δ ${state.lastHourBreakdown.netBatteryDeltaKwh >= 0 ? '+' : ''}${state.lastHourBreakdown.netBatteryDeltaKwh.toFixed(1)}`}
          statusLevel={batteryLevel}
          statusLabel={
            batteryLevel === 'nominal' ? 'Charged' : batteryLevel === 'warning' ? 'Low' : 'Critical'
          }
        />
        <TelemetryMetric
          label="Battery Health"
          value={state.batteryHealthPct.toFixed(0)}
          unit="%"
          progressPct={state.batteryHealthPct}
          delta="92% round-trip efficiency"
          statusLevel={state.batteryHealthPct < 88 ? 'warning' : 'nominal'}
          statusLabel={state.batteryHealthPct < 88 ? 'Degraded' : 'Healthy'}
        />
      </div>

      {/* Load Distribution & 72-hour Illumination Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        <div className="lg:col-span-5 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] space-y-4 sm:space-y-5">
          <h3 className="text-sm font-semibold text-slate-200">
            Load Allocation & Maintenance
          </h3>

          {/* Live Subsystem Load Table */}
          <div className="space-y-2 text-xs">
            {[
              {
                name: 'Life Support (ECLSS)',
                kw: state.lastHourBreakdown.lifeSupportKw,
                priority: state.priorities.lifeSupport,
                powered: state.poweredSubsystems.lifeSupport,
              },
              {
                name: 'Habitat Thermal & Avionics',
                kw: state.lastHourBreakdown.habitatKw,
                priority: state.priorities.habitatThermal,
                powered: state.poweredSubsystems.habitatThermal,
              },
              {
                name: 'Greenhouse Lighting',
                kw: state.lastHourBreakdown.agricultureKw,
                priority: state.priorities.agriculture,
                powered: state.poweredSubsystems.agriculture,
              },
              {
                name: 'Rover Charging Dock',
                kw: state.lastHourBreakdown.roverDockKw,
                priority: state.priorities.roverDock,
                powered: state.poweredSubsystems.roverDock,
              },
            ]
              .sort((a, b) => a.priority - b.priority)
              .map((row) => (
                <div
                  key={row.name}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-slate-500 mr-2">P{row.priority}</span>
                    <span className="text-slate-200 font-medium">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-mono tabular-nums text-slate-200">
                      {row.kw.toFixed(2)} kW
                    </span>
                    <StatusIndicator
                      level={row.powered ? 'nominal' : 'critical'}
                      label={row.powered ? 'On' : 'Shed'}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Priority Strategy Buttons */}
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 mb-2">
              <span>Emergency Load-Shedding Priority</span>
              <InfoTooltip
                title="Power (kW) vs. Energy (kWh) & Load Shedding"
                explanation="kW is instantaneous rate; kWh is stored battery energy. If total demand exceeds solar + battery capacity, P4 loads shut down first to protect P1."
                handbookSection="ch4-power"
                onOpenHandbook={onOpenHandbook}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onSetPriorityPreset('life-first')}
                className={`min-h-[50px] text-left px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors active:scale-[0.99] ${
                  activePreset === 'life-first'
                    ? 'border-cyan-400 bg-cyan-950/25 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-medium block">Crew Survival First (Recommended)</span>
                <span className="text-[11px] text-slate-400">
                  P1 Life Support · P2 Thermal · P3 Greenhouse · P4 Rover
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSetPriorityPreset('agriculture-boost')}
                className={`min-h-[50px] text-left px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors active:scale-[0.99] ${
                  activePreset === 'agriculture-boost'
                    ? 'border-cyan-400 bg-cyan-950/25 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-medium block">Protect Greenhouse Crops</span>
                <span className="text-[11px] text-slate-400">
                  P1 Life Support · P2 Greenhouse · P3 Thermal · P4 Rover
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSetPriorityPreset('rover-ops')}
                className={`min-h-[50px] text-left px-3 py-2.5 rounded-lg border text-xs cursor-pointer transition-colors active:scale-[0.99] ${
                  activePreset === 'rover-ops'
                    ? 'border-cyan-400 bg-cyan-950/25 text-cyan-200'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-medium block">Prioritize Rover Fast-Charge</span>
                <span className="text-[11px] text-slate-400">
                  P1 Life Support · P2 Thermal · P3 Rover · P4 Greenhouse
                </span>
              </button>
            </div>
          </div>

          {/* Maintenance Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={state.solarDustLossPct < 1}
              onClick={onCleanSolarArrays}
              className="min-h-[46px] sm:min-h-[38px] px-3.5 py-2 text-xs font-medium rounded-lg sm:rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
            >
              Clean Arrays (-{state.solarDustLossPct.toFixed(0)}% Dust)
            </button>
            <button
              type="button"
              disabled={state.batteryHealthPct >= 99}
              onClick={onRebalanceBattery}
              className="min-h-[46px] sm:min-h-[38px] px-3.5 py-2 text-xs font-medium rounded-lg sm:rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
            >
              Rebalance Battery Cells
            </button>
          </div>
        </div>

        {/* 72-Hour Solar Forecast Chart */}
        <div className="lg:col-span-7 min-w-0 p-3.5 sm:p-5 rounded-lg sm:rounded-md border border-slate-800 bg-[#0D1322] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-200">
                72-Hour Illumination & Power Forecast
              </h3>
              <p className="text-xs text-slate-400">
                Expected solar output (kW) vs demand ({state.totalPowerDemandKw.toFixed(1)} kW)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChartMobile((v) => !v)}
              aria-expanded={showChartMobile}
              className="md:hidden min-h-[40px] px-3 text-xs text-cyan-300 inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900/60 cursor-pointer shrink-0"
            >
              <span>{showChartMobile ? 'Hide Forecast' : 'View Forecast'}</span>
              {showChartMobile ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className={`${showChartMobile ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
            <div className="flex-1 min-h-[220px] sm:min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#64748B"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                  />
                  <YAxis
                    width={48}
                    stroke="#06B6D4"
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    unit=" kW"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1120',
                      borderColor: '#334155',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono, monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="estSolarKw"
                    name="Forecast Solar (kW)"
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="demandKw"
                    name="Current Demand (kW)"
                    stroke="#F59E0B"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="text-slate-200 font-medium">Engineering Note: </span>
              {SCIENTIFIC_ASSUMPTIONS.power.nasaReference}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
