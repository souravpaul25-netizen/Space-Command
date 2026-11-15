import { StatusIndicator } from '../components/StatusIndicator';
import { NASA_REFERENCES } from '../simulation/config';
import { evaluateMission } from '../simulation/scoring';
import type { SimulationState } from '../simulation/types';

interface MissionReportPageProps {
  state: SimulationState;
  onOpenNewMission: () => void;
}

export function MissionReportPage({
  state,
  onOpenNewMission,
}: MissionReportPageProps) {
  const evaluation = evaluateMission(state);
  const outcomeLevel =
    evaluation.outcomeGrade === 'Mission Success'
      ? 'nominal'
      : evaluation.outcomeGrade === 'Marginal Survival'
      ? 'info'
      : evaluation.outcomeGrade === 'Mission Compromise'
      ? 'warning'
      : 'critical';

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <section className="p-4 sm:p-6 rounded-md border border-slate-800 bg-[#0D1322] flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-100">
              Engineering Mission Report
            </h1>
            <StatusIndicator level={outcomeLevel} label={evaluation.outcomeGrade} />
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            {state.phase === 'active'
              ? `Live mid-mission assessment at Hour ${state.hour} (${(state.hour / 24).toFixed(1)} / ${state.config.missionDurationDays} days). Safety and crew survival govern final qualification.`
              : `Final evaluation after ${state.hour} hours (${(state.hour / 24).toFixed(1)} Earth days).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="sm:text-right">
            <span className="text-xs text-slate-400 block">Weighted Safety Score</span>
            <span className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums text-cyan-300">
              {evaluation.overallScore}
              <span className="text-sm text-slate-400 ml-1">/ 100</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenNewMission}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs font-semibold rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer"
          >
            Start New Simulation
          </button>
        </div>
      </section>

      {/* Transparent Scoring Breakdown */}
      <section className="p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Transparent Subsystem & Safety Breakdown
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crew safety, atmosphere, and radiation limits outweigh optional exploration bonuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {evaluation.categories.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 sm:p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  {cat.label}{' '}
                  <span className="font-mono text-slate-500">
                    ({Math.round(cat.weight * 100)}% weight)
                  </span>
                </span>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="font-mono tabular-nums text-sm font-semibold text-slate-100">
                    {cat.score}/100
                  </span>
                  <StatusIndicator
                    level={cat.status}
                    label={
                      cat.status === 'nominal'
                        ? 'Nominal'
                        : cat.status === 'warning'
                        ? 'Caution'
                        : 'Critical'
                    }
                  />
                </div>
              </div>
              <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${
                    cat.status === 'nominal'
                      ? 'bg-emerald-400'
                      : cat.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{cat.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Educational Debrief: 4 Structured Questions */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-2">
          <h3 className="text-sm font-semibold text-cyan-300">1. What Happened</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {evaluation.debrief.whatHappened}
          </p>
        </div>
        <div className="p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-2">
          <h3 className="text-sm font-semibold text-cyan-300">2. Why It Happened</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {evaluation.debrief.whyItHappened}
          </p>
        </div>
        <div className="p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-2">
          <h3 className="text-sm font-semibold text-cyan-300">
            3. Engineering Principle Involved
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {evaluation.debrief.engineeringPrinciple}
          </p>
        </div>
        <div className="p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-2">
          <h3 className="text-sm font-semibold text-cyan-300">
            4. What Could Be Done Differently
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {evaluation.debrief.whatCouldBeDoneDifferently}
          </p>
        </div>
      </section>

      {/* Player Engineering Decision Log + NASA References */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <section className="lg:col-span-7 p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Commander Decision & Rationale Log
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {state.decisions.length} logged decisions
            </span>
          </div>
          {state.decisions.length === 0 ? (
            <p className="text-xs text-slate-400">
              No manual engineering changes logged yet. Adjust controls in any subsystem to see
              real-time cause-and-effect explanations here.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[300px] overflow-y-auto pr-1">
              {state.decisions.map((dec) => (
                <div key={dec.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-slate-100">{dec.actionTitle}</span>
                    <span className="font-mono tabular-nums text-slate-500 shrink-0">
                      H{dec.hour} · {dec.subsystem}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{dec.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 p-3.5 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            NASA Technical & Educational References
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Simulation models are simplified educational approximations inspired by NASA Artemis
            sustainability architecture and ISS ECLSS baselines.
          </p>
          <div className="space-y-2.5 pt-1">
            {NASA_REFERENCES.map((ref) => (
              <div
                key={ref.url}
                className="p-3 rounded border border-slate-800 bg-slate-900/40"
              >
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-0.5 text-xs font-medium text-cyan-400 hover:underline"
                >
                  {ref.title}
                </a>
                <p className="text-xs text-slate-400 mt-0.5">{ref.topic}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
