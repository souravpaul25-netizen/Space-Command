import { useState } from 'react';
import { BookOpen, Menu, Pause, Play, RotateCcw, StepForward, X } from 'lucide-react';
import { LUNAR_SITE_PROFILES } from '../simulation/config';
import { formatMissionTime } from '../simulation/time';
import type { AppScreen, SimulationState } from '../simulation/types';
import { StatusIndicator } from './StatusIndicator';

interface TopNavProps {
  activeScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  onOpenSetup: () => void;
  state: SimulationState;
  onTogglePause: () => void;
  onStepHours: (hours: number) => void;
}

const NAV_ITEMS: Array<{ id: AppScreen; label: string }> = [
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'subsystems', label: 'Subsystems' },
  { id: 'lunar-surface', label: 'Lunar Surface' },
  { id: 'mission-report', label: 'Mission Report' },
  { id: 'handbook', label: 'Mission Handbook' },
];

export function TopNav({
  activeScreen,
  onSelectScreen,
  onOpenSetup,
  state,
  onTogglePause,
  onStepHours,
}: TopNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeInfo = formatMissionTime(state.hour);
  const site = LUNAR_SITE_PROFILES[state.config.siteId];

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
      state.alerts.some((a) => !a.resolved && a.severity === 'warning'));

  const overallLevel = hasCritical
    ? 'critical'
    : hasWarning
    ? 'warning'
    : 'nominal';

  const overallLabel =
    state.phase === 'failed'
      ? 'Mission Failed'
      : state.phase === 'completed'
      ? 'Mission Complete'
      : hasCritical
      ? 'Critical Alert'
      : hasWarning
      ? 'Caution'
      : 'Nominal';

  const handleMobileNav = (screen: AppScreen) => {
    setMobileMenuOpen(false);
    onSelectScreen(screen);
  };

  return (
    <div className="hidden lg:block border-b border-slate-800 bg-[#0A0F1D]">
      {/* Strict 3-Zone Top Bar Contract (Desktop) */}
      <header className="max-w-[1440px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleMobileNav('mission-control')}
          className="text-base sm:text-lg font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded py-1"
        >
          Space Command
        </button>

        {/* Zone 2: Concise single-line text nav links (Desktop 1024px+) */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`inline-flex items-center gap-1.5 py-4 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.id === 'handbook' && <BookOpen className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action (Desktop) + Compact Mobile Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleMobileNav('handbook')}
            aria-label="Open Mission Handbook"
            className={`lg:hidden inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium rounded border transition-colors cursor-pointer ${
              activeScreen === 'handbook'
                ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Handbook</span>
          </button>

          <button
            type="button"
            onClick={onOpenSetup}
            className="hidden lg:inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Mission</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-slate-800 bg-[#080D19] px-3 py-3 space-y-1.5"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMobileNav(item.id)}
                className={`w-full min-h-[48px] px-4 py-2.5 text-left text-sm font-medium rounded flex items-center justify-between cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {item.id === 'handbook' && <BookOpen className="w-4 h-4 text-cyan-400" />}
                  <span>{item.label}</span>
                </span>
                {isActive && <span className="text-[11px] font-mono text-cyan-300">Active</span>}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSetup();
              }}
              className="w-full min-h-[48px] px-4 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Configure New Mission</span>
            </button>
          </div>
        </nav>
      )}

      {/* Telemetry & Fixed-Timestep Simulation Control Ribbon */}
      <div className="border-t border-slate-800/80 bg-[#070B14]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 min-w-0">
            <span className="font-mono tabular-nums text-slate-100 font-medium">
              {timeInfo.formatted} / {state.config.missionDurationDays}d
            </span>
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <StatusIndicator level={overallLevel} label={overallLabel} />
            <span aria-hidden="true" className="text-slate-700">
              ·
            </span>
            <span className="font-mono tabular-nums">
              Crew {state.config.crewSize}/{state.config.crewSize} ·{' '}
              <span className="text-slate-200">{state.crewHealthPct.toFixed(0)}%</span>
            </span>
            <span aria-hidden="true" className="text-slate-700 hidden lg:inline">
              ·
            </span>
            <span className="hidden lg:inline text-slate-400">{site.name}</span>
          </div>

          {/* Time Progression Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={state.phase !== 'active'}
              onClick={onTogglePause}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {state.paused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <div className="flex items-center rounded border border-slate-800 bg-slate-900/70 divide-x divide-slate-800">
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(1)}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-mono tabular-nums text-slate-200 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Advance 1 simulation hour"
              >
                <StepForward className="w-3 h-3" />
                <span>+1h</span>
              </button>
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(6)}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 text-xs font-mono tabular-nums text-slate-200 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Advance 6 simulation hours"
              >
                +6h
              </button>
              <button
                type="button"
                disabled={state.phase !== 'active'}
                onClick={() => onStepHours(24)}
                className="min-h-[44px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 text-xs font-mono tabular-nums text-slate-200 hover:bg-slate-800 hover:text-cyan-300 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Advance 1 Earth day (24 hours)"
              >
                +1d <span className="hidden sm:inline">(24h)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
