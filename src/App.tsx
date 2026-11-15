import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { BeginnerTutorialModal } from './components/BeginnerTutorialModal';
import { ConfirmActionModal } from './components/ConfirmActionModal';
import { MissionSetupModal } from './components/MissionSetupModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileGameHUD } from './components/MobileGameHUD';
import { StatusIndicator } from './components/StatusIndicator';
import { TopNav } from './components/TopNav';
import type { HandbookSectionId } from './data/handbookContent';
import { useSimulation } from './hooks/useSimulation';
import { LunarSurfacePage } from './pages/LunarSurfacePage';
import { MissionControlPage } from './pages/MissionControlPage';
import { MissionHandbookPage } from './pages/MissionHandbookPage';
import { MissionReportPage } from './pages/MissionReportPage';
import { SubsystemsPage } from './pages/SubsystemsPage';
import type { AppScreen, SubsystemId } from './simulation/types';

const TUTORIAL_SEEN_KEY = 'space_command_tutorial_seen_v1';

export default function App() {
  const { state, actions } = useSimulation();
  const [activeScreen, setActiveScreen] = useState<AppScreen>('mission-control');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('mission-control');
  const [handbookSection, setHandbookSection] = useState<HandbookSectionId>('ch1-briefing');
  const [activeSubsystem, setActiveSubsystem] = useState<SubsystemId>('life-support');
  const [setupOpen, setSetupOpen] = useState(false);
  const [confirmNewMissionOpen, setConfirmNewMissionOpen] = useState(false);
  const [dismissedFeedbackId, setDismissedFeedbackId] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(TUTORIAL_SEEN_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    try {
      window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectScreen = (screen: AppScreen) => {
    if (screen === 'handbook' && activeScreen !== 'handbook') {
      setPreviousScreen(activeScreen);
    }
    setActiveScreen(screen);
  };

  const handleOpenHandbookSection = (section: HandbookSectionId) => {
    if (activeScreen !== 'handbook') {
      setPreviousScreen(activeScreen);
    }
    setHandbookSection(section);
    setActiveScreen('handbook');
  };

  const handleNavigateSubsystem = (sub: SubsystemId) => {
    setActiveSubsystem(sub);
    setActiveScreen('subsystems');
  };

  const handleRequestNewMission = () => {
    if (state.phase === 'active' && state.hour > 0) {
      setConfirmNewMissionOpen(true);
    } else {
      setSetupOpen(true);
    }
  };

  const showFeedback =
    state.lastDecisionFeedback &&
    activeScreen !== 'handbook' &&
    state.lastDecisionFeedback.id !== dismissedFeedbackId;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col overflow-x-hidden">
      {/* Desktop Top Navigation (1024px+) */}
      <TopNav
        activeScreen={activeScreen}
        onSelectScreen={handleSelectScreen}
        onOpenSetup={handleRequestNewMission}
        state={state}
        onTogglePause={actions.togglePause}
        onStepHours={actions.stepHours}
      />

      {/* Mobile & Tablet Persistent Game HUD (< 1024px) */}
      <MobileGameHUD
        activeScreen={activeScreen}
        state={state}
        onSelectScreen={handleSelectScreen}
        onNavigateSubsystem={handleNavigateSubsystem}
        onTogglePause={actions.togglePause}
        onStepHours={actions.stepHours}
        onRequestNewMission={handleRequestNewMission}
        onReplayTutorial={() => setTutorialOpen(true)}
      />

      <main className="flex-1 max-w-[1440px] w-full min-w-0 mx-auto px-3 sm:px-6 pt-3 pb-24 sm:pt-5 lg:py-6 space-y-3.5 sm:space-y-5">
        {/* Critical Event Interrupt or Mission Completion Banner */}
        {(state.pauseReason || state.phase !== 'active') && (
          <div
            role="alert"
            className={`p-3 sm:p-4 rounded-lg sm:rounded-md border flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 ${
              state.phase === 'failed'
                ? 'border-rose-500/60 bg-rose-950/30'
                : state.phase === 'completed'
                ? 'border-emerald-500/60 bg-emerald-950/30'
                : 'border-amber-500/60 bg-amber-950/30'
            }`}
          >
            <div className="space-y-0.5 min-w-0">
              <StatusIndicator
                level={
                  state.phase === 'failed'
                    ? 'critical'
                    : state.phase === 'completed'
                    ? 'nominal'
                    : 'warning'
                }
                label={
                  state.phase === 'failed'
                    ? 'Mission Failed'
                    : state.phase === 'completed'
                    ? '30-Day Mission Completed'
                    : 'Simulation Auto-Paused on Critical Event'
                }
              />
              <p className="text-xs text-slate-200">
                {state.phase === 'failed'
                  ? state.failureReason
                  : state.phase === 'completed'
                  ? 'All mission days elapsed. Review your safety score and engineering lessons in Mission Report.'
                  : state.pauseReason}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {state.phase === 'active' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleNavigateSubsystem('radiation')}
                    className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded border border-amber-400/50 text-amber-200 hover:bg-amber-900/40 cursor-pointer"
                  >
                    Open Radiation Safety
                  </button>
                  <button
                    type="button"
                    onClick={actions.dismissPauseBanner}
                    className="min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded border border-slate-700 text-slate-300 hover:text-slate-100 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectScreen('mission-report')}
                  className="min-h-[44px] sm:min-h-0 px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-lg sm:rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer"
                >
                  View Mission Report
                </button>
              )}
            </div>
          </div>
        )}

        {/* Educational Cause-and-Effect Decision Feedback Bar */}
        {showFeedback && state.lastDecisionFeedback && (
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-md border border-slate-800 bg-[#0B1120] flex items-start sm:items-center justify-between gap-2.5">
            <div className="text-xs min-w-0 leading-relaxed">
              <span className="font-semibold text-cyan-300">
                {state.lastDecisionFeedback.actionTitle}:{' '}
              </span>
              <span className="text-slate-300">
                {state.lastDecisionFeedback.explanation}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono tabular-nums text-slate-500">
                H{state.lastDecisionFeedback.hour}
              </span>
              <button
                type="button"
                aria-label="Dismiss action feedback"
                onClick={() => setDismissedFeedbackId(state.lastDecisionFeedback?.id ?? null)}
                className="min-w-[32px] min-h-[32px] inline-flex items-center justify-center rounded text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Active Screen Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen === 'subsystems' ? `sub-${activeSubsystem}` : activeScreen}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            {activeScreen === 'mission-control' && (
              <MissionControlPage
                state={state}
                onNavigateSubsystem={handleNavigateSubsystem}
                onNavigateScreen={handleSelectScreen}
                onTogglePause={actions.togglePause}
                onStepHours={actions.stepHours}
              />
            )}

            {activeScreen === 'subsystems' && (
              <SubsystemsPage
                state={state}
                activeSubsystem={activeSubsystem}
                onSelectSubsystem={setActiveSubsystem}
                onOpenHandbook={handleOpenHandbookSection}
                actions={actions}
              />
            )}

            {activeScreen === 'lunar-surface' && (
              <LunarSurfacePage
                state={state}
                onDispatch={actions.dispatchRover}
                onCollectSample={actions.collectSample}
                onReturnToBase={actions.returnRover}
                onToggleCharging={actions.toggleRoverCharging}
                onRepairMobility={actions.repairRoverMobility}
                onOpenHandbook={handleOpenHandbookSection}
              />
            )}

            {activeScreen === 'mission-report' && (
              <MissionReportPage
                state={state}
                onOpenNewMission={handleRequestNewMission}
              />
            )}

            {activeScreen === 'handbook' && (
              <MissionHandbookPage
                key={handbookSection}
                initialSection={handbookSection}
                onReturnToSimulation={() =>
                  setActiveScreen(previousScreen === 'handbook' ? 'mission-control' : previousScreen)
                }
                onReplayTutorial={() => setTutorialOpen(true)}
                onJumpToSubsystem={(sub) =>
                  sub === 'rover'
                    ? setActiveScreen('lunar-surface')
                    : handleNavigateSubsystem(sub)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile & Tablet Fixed Bottom Game Navigation Bar (< 1024px) */}
      <MobileBottomNav
        activeScreen={activeScreen}
        activeSubsystem={activeSubsystem}
        state={state}
        onSelectOverview={() => handleSelectScreen('mission-control')}
        onSelectSubsystem={handleNavigateSubsystem}
        onSelectRover={() => handleSelectScreen('lunar-surface')}
      />

      {setupOpen && (
        <MissionSetupModal
          currentConfig={state.config}
          onClose={() => setSetupOpen(false)}
          onStartMission={(cfg) => {
            actions.startNewMission(cfg);
            setDismissedFeedbackId(null);
            setActiveScreen('mission-control');
          }}
        />
      )}

      <ConfirmActionModal
        open={confirmNewMissionOpen}
        title="Configure & Reset Current Mission?"
        description={`You are currently on Hour ${state.hour} of your ${state.config.missionDurationDays}-day mission. Opening a new setup allows replacing your current outpost progress.`}
        confirmLabel="Open New Mission Setup"
        tone="warning"
        onCancel={() => setConfirmNewMissionOpen(false)}
        onConfirm={() => {
          setConfirmNewMissionOpen(false);
          setSetupOpen(true);
        }}
      />

      {tutorialOpen && (
        <BeginnerTutorialModal
          onClose={handleCloseTutorial}
          onNavigateScreen={handleSelectScreen}
        />
      )}
    </div>
  );
}
