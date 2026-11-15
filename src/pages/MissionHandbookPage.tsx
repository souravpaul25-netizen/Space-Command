import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';
import {
  EMERGENCY_PROCEDURES,
  EXTERNAL_REFERENCES,
  GLOSSARY_TERMS,
  HANDBOOK_CHAPTERS,
  type ExternalReference,
  type HandbookSectionId,
  type ReferenceTopicKey,
} from '../data/handbookContent';
import { CROP_CATALOG } from '../simulation/config';
import type { CropType, SubsystemId } from '../simulation/types';

interface MissionHandbookPageProps {
  initialSection?: HandbookSectionId;
  onReturnToSimulation: () => void;
  onReplayTutorial: () => void;
  onJumpToSubsystem: (sub: SubsystemId) => void;
}

interface HandbookProgress {
  completed: HandbookSectionId[];
  bookmarked: HandbookSectionId[];
}

const PROGRESS_STORAGE_KEY = 'space_command_handbook_progress_v1';

const REFERENCE_TOPICS: ReferenceTopicKey[] = [
  'A. Lunar Missions and Habitats',
  'B. Life Support and Atmosphere Control',
  'C. Power and Energy Management',
  'D. Radiation Protection',
  'E. Space Agriculture',
  'F. Lunar Rover and Resource Exploration',
  'G. Interconnected Systems and Mission Sustainability',
];

function MobileAccordionBox({
  title,
  subtitle,
  defaultOpenMobile = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpenMobile?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpenMobile);
  return (
    <div className="rounded-lg sm:rounded-md border border-slate-800 bg-slate-900/35 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden w-full min-h-[48px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-left bg-slate-900/70 cursor-pointer"
      >
        <div className="min-w-0">
          <span className="text-xs font-semibold text-cyan-300 block truncate">{title}</span>
          {subtitle && <span className="text-[11px] text-slate-400 block truncate">{subtitle}</span>}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      <div className={`${open ? 'block' : 'hidden'} md:block p-3.5 sm:p-4`}>{children}</div>
    </div>
  );
}

function GlossaryEntryCard({ item }: { item: (typeof GLOSSARY_TERMS)[number] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-3.5 sm:p-4 rounded-lg sm:rounded border border-slate-800 bg-slate-900/40 space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">
          {item.term}
          {item.symbol && (
            <span className="ml-2 font-mono text-xs text-cyan-300">({item.symbol})</span>
          )}
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          {item.category}
          {item.units ? ` · ${item.units}` : ''}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{item.definition}</p>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="md:hidden min-h-[38px] inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 cursor-pointer"
      >
        <span>{expanded ? 'Hide example & role' : 'Show example & in-game role'}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <div className={`${expanded ? 'block' : 'hidden'} md:block space-y-1 pt-0.5`}>
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-slate-200 font-medium">Example: </span>
          {item.example}
        </p>
        <p className="text-xs text-cyan-300/90 leading-relaxed">
          <span className="text-slate-200 font-medium">In Space Command: </span>
          {item.inGameRole}
        </p>
      </div>
    </div>
  );
}

function ReferenceCard({ item }: { item: ExternalReference }) {
  return (
    <div className="p-3.5 sm:p-4 rounded-lg sm:rounded-md border border-slate-800 bg-slate-900/45 flex flex-col justify-between gap-3">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono text-slate-400">
          <span className="text-cyan-300 font-medium">{item.organization}</span>
          <span aria-hidden="true">·</span>
          <span>{item.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span>{item.kind}</span>
        </div>
        <h4 className="text-sm font-semibold text-slate-100 leading-snug">
          {item.title}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-slate-200 font-medium">In Space Command: </span>
          {item.mechanicConnection}
        </p>
      </div>
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 truncate">{item.topic}</span>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded border border-cyan-500/40 bg-cyan-950/25 text-cyan-300 hover:bg-cyan-900/40 shrink-0"
        >
          <span>Read Article</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function ExploreMoreSection({
  topic,
  onOpenAllResources,
}: {
  topic: ReferenceTopicKey;
  onOpenAllResources: () => void;
}) {
  const [openMobile, setOpenMobile] = useState(false);
  const items = EXTERNAL_REFERENCES.filter((r) => r.topic === topic).slice(0, 3);
  return (
    <div className="pt-4 border-t border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-100">
            Explore More · Real NASA & Space Agency Science
          </h3>
          <p className="text-xs text-slate-400">
            Verified articles connected to {topic}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          className="md:hidden min-h-[44px] px-3 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{openMobile ? 'Hide' : `Show (${items.length})`}</span>
          {openMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={onOpenAllResources}
          className="hidden md:inline-flex min-h-[40px] sm:min-h-0 text-xs font-medium text-cyan-400 hover:underline cursor-pointer"
        >
          Browse All 22 References in Ch 12 →
        </button>
      </div>
      <div className={`${openMobile ? 'block' : 'hidden'} md:block space-y-3`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((ref) => (
            <ReferenceCard key={ref.id} item={ref} />
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenAllResources}
          className="md:hidden w-full min-h-[44px] text-xs font-medium rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 cursor-pointer"
        >
          Browse All 22 References in Ch 12 →
        </button>
      </div>
    </div>
  );
}

export function MissionHandbookPage({
  initialSection = 'ch1-briefing',
  onReturnToSimulation,
  onReplayTutorial,
  onJumpToSubsystem,
}: MissionHandbookPageProps) {
  const [activeSection, setActiveSection] = useState<HandbookSectionId>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState<string>('All');
  const [resourceTopicFilter, setResourceTopicFilter] = useState<string>('All');
  const [resourceDifficultyFilter, setResourceDifficultyFilter] = useState<string>('All');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [progress, setProgress] = useState<HandbookProgress>(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HandbookProgress;
        return {
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          bookmarked: Array.isArray(parsed.bookmarked) ? parsed.bookmarked : [],
        };
      }
    } catch {
      // Ignore storage read errors
    }
    return { completed: [], bookmarked: [] };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage write errors
    }
  }, [progress]);

  const toggleCompleted = (id: HandbookSectionId) => {
    setProgress((prev) => ({
      ...prev,
      completed: prev.completed.includes(id)
        ? prev.completed.filter((c) => c !== id)
        : [...prev.completed, id],
    }));
  };

  const toggleBookmarked = (id: HandbookSectionId) => {
    setProgress((prev) => ({
      ...prev,
      bookmarked: prev.bookmarked.includes(id)
        ? prev.bookmarked.filter((b) => b !== id)
        : [...prev.bookmarked, id],
    }));
  };

  const activeChapterMeta =
    HANDBOOK_CHAPTERS.find((c) => c.id === activeSection) ?? HANDBOOK_CHAPTERS[0];
  const activeIdx = HANDBOOK_CHAPTERS.findIndex((c) => c.id === activeSection);
  const prevChapter = activeIdx > 0 ? HANDBOOK_CHAPTERS[activeIdx - 1] : null;
  const nextChapter =
    activeIdx >= 0 && activeIdx < HANDBOOK_CHAPTERS.length - 1
      ? HANDBOOK_CHAPTERS[activeIdx + 1]
      : null;

  const isCompleted = progress.completed.includes(activeSection);
  const isBookmarked = progress.bookmarked.includes(activeSection);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return null;

    const chapterKeywords: Array<{ id: HandbookSectionId; label: string; keywords: string }> = [
      {
        id: 'ch1-briefing',
        label: 'Chapter 1: Mission Briefing',
        keywords: 'purpose scenario 4 astronauts 30 days commander survival objectives briefing',
      },
      {
        id: 'ch2-interface',
        label: 'Chapter 2: Understanding the Interface',
        keywords: 'dashboard indicators crew timer power health alerts pause resume +1h +6h +1d diagram',
      },
      {
        id: 'ch3-life-support',
        label: 'Chapter 3: Life Support & Atmosphere Control',
        keywords: 'oxygen o2 co2 carbon dioxide scrubber water recycling wrs electrolysis 2h2o 2h2 0.84',
      },
      {
        id: 'ch4-power',
        label: 'Chapter 4: Power Grid & Energy Management',
        keywords: 'solar battery charging discharging kw kwh power energy load priority shedding dust eclipse 92%',
      },
      {
        id: 'ch5-radiation',
        label: 'Chapter 5: Radiation Protection & Habitat Safety',
        keywords: 'radiation gcr spe solar particle event shielding aluminium water regolith shelter msv 250',
      },
      {
        id: 'ch6-agriculture',
        label: 'Chapter 6: Food Production & Greenhouse',
        keywords: 'hydroponics food lettuce radish soybean potato nutrients led photosynthesis co2 o2 transpiration',
      },
      {
        id: 'ch7-rover',
        label: 'Chapter 7: Lunar Rover & Resource Exploration',
        keywords: 'rover terrain crater slope battery 12km comm range sample ice water isru 92% detour direct',
      },
      {
        id: 'ch8-interconnected',
        label: 'Chapter 8: Resource Management & Interconnected Systems',
        keywords: 'interconnected coupling survival sustainability exploration trade-offs ripple',
      },
      {
        id: 'ch9-emergencies',
        label: 'Chapter 9: Emergency Procedures',
        keywords: 'emergency low oxygen high co2 critical battery solar radiation greenhouse water rover comms equipment',
      },
      {
        id: 'ch10-glossary',
        label: 'Chapter 10: Scientific Glossary',
        keywords: 'glossary definitions units symbols o2 co2 electrolysis hydroponics gcr spe isru regolith',
      },
      {
        id: 'ch11-strategy',
        label: 'Chapter 11: Tips, Strategies & Common Mistakes',
        keywords: 'tips beginner advanced strategy common mistakes simplified vs real nasa',
      },
      {
        id: 'ch12-resources',
        label: 'Chapter 12: Further Reading & Scientific References',
        keywords: 'nasa esa artemis viper melissa veggi external links articles reading',
      },
    ];

    const matchingChapters = chapterKeywords.filter(
      (c) => c.label.toLowerCase().includes(trimmedQuery) || c.keywords.includes(trimmedQuery)
    );

    const matchingEmergencies = EMERGENCY_PROCEDURES.filter(
      (e) =>
        e.alert.toLowerCase().includes(trimmedQuery) ||
        e.meaning.toLowerCase().includes(trimmedQuery) ||
        e.prioritizedActions.toLowerCase().includes(trimmedQuery)
    );

    const matchingGlossary = GLOSSARY_TERMS.filter(
      (g) =>
        g.term.toLowerCase().includes(trimmedQuery) ||
        g.definition.toLowerCase().includes(trimmedQuery) ||
        g.inGameRole.toLowerCase().includes(trimmedQuery) ||
        g.category.toLowerCase().includes(trimmedQuery)
    );

    const matchingReferences = EXTERNAL_REFERENCES.filter(
      (r) =>
        r.title.toLowerCase().includes(trimmedQuery) ||
        r.summary.toLowerCase().includes(trimmedQuery) ||
        r.topic.toLowerCase().includes(trimmedQuery) ||
        r.organization.toLowerCase().includes(trimmedQuery)
    );

    return {
      matchingChapters,
      matchingEmergencies,
      matchingGlossary,
      matchingReferences,
    };
  }, [trimmedQuery]);

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_TERMS.filter((item) => {
      const catMatch = glossaryCategory === 'All' || item.category === glossaryCategory;
      const qMatch =
        !trimmedQuery ||
        item.term.toLowerCase().includes(trimmedQuery) ||
        item.definition.toLowerCase().includes(trimmedQuery) ||
        item.inGameRole.toLowerCase().includes(trimmedQuery);
      return catMatch && qMatch;
    });
  }, [glossaryCategory, trimmedQuery]);

  const filteredReferences = useMemo(() => {
    return EXTERNAL_REFERENCES.filter((ref) => {
      const topicOk = resourceTopicFilter === 'All' || ref.topic === resourceTopicFilter;
      const diffOk =
        resourceDifficultyFilter === 'All' || ref.difficulty === resourceDifficultyFilter;
      const qOk =
        !trimmedQuery ||
        ref.title.toLowerCase().includes(trimmedQuery) ||
        ref.summary.toLowerCase().includes(trimmedQuery) ||
        ref.mechanicConnection.toLowerCase().includes(trimmedQuery);
      return topicOk && diffOk && qOk;
    });
  }, [resourceTopicFilter, resourceDifficultyFilter, trimmedQuery]);

  const selectChapter = (id: HandbookSectionId) => {
    setActiveSection(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Handbook Header, Progress & Search */}
      <section className="p-4 sm:p-5 rounded-md border border-slate-800 bg-[#0D1322] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <BookOpen className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-100">
                Mission Handbook & Commander Manual
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                12 chapters · {progress.completed.length}/{HANDBOOK_CHAPTERS.length} completed ·{' '}
                {progress.bookmarked.length} bookmarked · Timer & mission progress remain untouched
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onReplayTutorial}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Replay Tutorial</span>
            </button>
            <button
              type="button"
              onClick={onReturnToSimulation}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-cyan-400 text-slate-950 hover:bg-cyan-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Simulation</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chapters, 10 emergency checklists, 18 glossary terms, or NASA resources..."
            aria-label="Search Mission Handbook"
            className="w-full min-h-[44px] sm:min-h-0 pl-10 pr-4 py-2.5 text-xs rounded-md border border-slate-700 bg-[#070B14] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </section>

      {/* Instant Search Results Panel */}
      {searchResults && (
        <section className="p-4 sm:p-5 rounded-md border border-cyan-500/40 bg-[#0B1224] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-cyan-300">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="min-h-[36px] sm:min-h-0 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {searchResults.matchingChapters.length === 0 &&
          searchResults.matchingEmergencies.length === 0 &&
          searchResults.matchingGlossary.length === 0 &&
          searchResults.matchingReferences.length === 0 ? (
            <p className="text-xs text-slate-400">
              No matching handbook topics found. Try &ldquo;oxygen&rdquo;, &ldquo;kWh&rdquo;,
              &ldquo;SPE&rdquo;, &ldquo;ISRU&rdquo;, or &ldquo;potato&rdquo;.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {searchResults.matchingChapters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Chapters</p>
                  <div className="space-y-1.5">
                    {searchResults.matchingChapters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectChapter(c.id);
                          setSearchQuery('');
                        }}
                        className="w-full min-h-[40px] sm:min-h-0 text-left px-3 py-2 text-xs rounded border border-slate-800 bg-slate-900/60 text-cyan-300 hover:border-cyan-400 cursor-pointer"
                      >
                        {c.label} →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.matchingEmergencies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Emergencies (Ch 9)</p>
                  <div className="space-y-1.5">
                    {searchResults.matchingEmergencies.map((em) => (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => {
                          selectChapter('ch9-emergencies');
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2.5 text-xs rounded border border-slate-800 bg-slate-900/60 hover:border-amber-400 cursor-pointer"
                      >
                        <span className="font-medium text-amber-300 block">{em.alert}</span>
                        <span className="text-slate-400">{em.whereToGo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.matchingGlossary.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Glossary (Ch 10)</p>
                  <div className="space-y-1.5">
                    {searchResults.matchingGlossary.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          selectChapter('ch10-glossary');
                          setGlossaryCategory('All');
                        }}
                        className="w-full text-left p-2.5 text-xs rounded border border-slate-800 bg-slate-900/60 hover:border-cyan-400 cursor-pointer"
                      >
                        <span className="font-medium text-slate-100 block">{g.term}</span>
                        <span className="text-slate-400 line-clamp-2">{g.definition}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.matchingReferences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">NASA & Space Articles (Ch 12)</p>
                  <div className="space-y-1.5">
                    {searchResults.matchingReferences.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          selectChapter('ch12-resources');
                          setResourceTopicFilter('All');
                          setResourceDifficultyFilter('All');
                        }}
                        className="w-full text-left p-2.5 text-xs rounded border border-slate-800 bg-slate-900/60 hover:border-cyan-400 cursor-pointer"
                      >
                        <span className="font-medium text-cyan-300 block">{r.title}</span>
                        <span className="text-slate-400">{r.organization} · {r.difficulty}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Mobile Chapter Switcher */}
      <div className="lg:hidden rounded-md border border-slate-800 bg-[#0D1322] p-3 space-y-2">
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-expanded={mobileNavOpen}
          className="w-full min-h-[44px] px-3 py-2 rounded border border-slate-700 bg-slate-900/70 flex items-center justify-between gap-2 text-left cursor-pointer"
        >
          <div className="min-w-0">
            <span className="text-[11px] font-mono text-slate-400 block">
              HANDBOOK CHAPTER ({activeIdx + 1} / {HANDBOOK_CHAPTERS.length})
            </span>
            <span className="text-xs font-semibold text-cyan-300 truncate block">
              {activeChapterMeta.title}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              mobileNavOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {mobileNavOpen && (
          <div className="pt-1 space-y-1 max-h-[55vh] overflow-y-auto">
            {HANDBOOK_CHAPTERS.map((chap) => {
              const active = chap.id === activeSection;
              const done = progress.completed.includes(chap.id);
              const saved = progress.bookmarked.includes(chap.id);
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => selectChapter(chap.id)}
                  className={`w-full min-h-[44px] px-3 py-2 text-left text-xs rounded flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <span className="truncate">{chap.shortLabel}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {saved && <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Split: Desktop Sidebar + Chapter Article */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 p-3 rounded-md border border-slate-800 bg-[#0D1322] lg:sticky lg:top-4">
          <div className="space-y-4">
            {(['Orientation', 'Subsystem Guides', 'Operations & Science'] as const).map(
              (group) => (
                <div key={group} className="space-y-1">
                  <span className="block px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    {group}
                  </span>
                  {HANDBOOK_CHAPTERS.filter((c) => c.group === group).map((chap) => {
                    const active = activeSection === chap.id;
                    const done = progress.completed.includes(chap.id);
                    const saved = progress.bookmarked.includes(chap.id);
                    return (
                      <button
                        key={chap.id}
                        type="button"
                        onClick={() => selectChapter(chap.id)}
                        className={`w-full px-2.5 py-2 text-left text-xs font-medium rounded flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{chap.shortLabel}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {saved && (
                            <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
                          )}
                          {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </aside>

        {/* Main Chapter Viewport */}
        <article className="lg:col-span-9 min-w-0 p-4 sm:p-6 rounded-md border border-slate-800 bg-[#0D1322] space-y-6">
          {/* Chapter Action Toolbar (Bookmark + Mark Completed) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="min-w-0">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                {activeChapterMeta.group} · Chapter {activeIdx + 1} of {HANDBOOK_CHAPTERS.length}
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mt-0.5">
                {activeChapterMeta.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleBookmarked(activeSection)}
                className={`min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  isBookmarked
                    ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`}
                />
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleCompleted(activeSection)}
                className={`min-h-[40px] sm:min-h-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border cursor-pointer ${
                  isCompleted
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Completed' : 'Mark as Read'}</span>
              </button>
            </div>
          </div>

          {/* CHAPTER 1: MISSION BRIEFING */}
          {activeSection === 'ch1-briefing' && (
            <div className="space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                  <h3 className="text-sm font-semibold text-cyan-300">What Is SPACE COMMAND?</h3>
                  <p className="text-xs leading-relaxed">
                    <strong>Space Command</strong> is an educational aerospace systems simulator
                    created for the 2026 NASA Space Apps Challenge. Instead of an arcade game, you
                    operate a scientifically grounded lunar research outpost where engineering choices
                    in one subsystem ripple across air, water, electricity, radiation, food, and
                    exploration.
                  </p>
                </div>
                <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    What Is a Lunar Outpost & Why Go?
                  </h3>
                  <p className="text-xs leading-relaxed">
                    A lunar outpost is a pressurized surface laboratory—much more permanent than the
                    short Apollo landings. Establishing a sustainable base near the{' '}
                    <strong>Lunar South Pole</strong> lets scientists study permanently shadowed
                    water-ice craters, test closed-loop life support, and prepare technologies for
                    future Mars expeditions.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-[#080D19] space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Your Scenario & Role as Mission Commander
                </h3>
                <p className="text-xs leading-relaxed">
                  You command <strong>4 astronauts</strong> (configurable 2–6 in New Mission) on a{' '}
                  <strong>30-Earth-day (720-hour)</strong> expedition at{' '}
                  <strong>Shackleton Crater Rim</strong> (89.5° S). Resupply rockets do not arrive
                  mid-mission: you begin with finite oxygen (62 kg + 18 kg emergency reserve),
                  water (240 L), packaged food (60 kg), and battery storage (120 kWh). Because{' '}
                  <strong>60 kg of food only lasts ~24.2 days</strong>, survival alone requires
                  active greenhouse farming, water recycling, and solar/radiation management.
                </p>
              </div>

              <MobileAccordionBox
                title="Surviving vs. Mission Success & Failure Triggers"
                subtitle="Tap to view win and failure thresholds"
                defaultOpenMobile={false}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 sm:p-4 rounded border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                    <StatusIndicator level="nominal" label="Surviving vs. Completing Objectives" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong>Bare Survival</strong> keeps crew health above 0% through Hour 720,
                      even if food is razor-thin or radiation dose is high (<em>Marginal Survival</em>
                      ). <strong>Mission Success</strong> requires finishing Day 30 with healthy
                      reserves, low radiation dose (&lt; 50 mSv caution), maintained equipment,
                      harvested greenhouse crops, and rover geological/ISRU surveys.
                    </p>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded border border-rose-500/30 bg-rose-950/15 space-y-2">
                    <StatusIndicator level="critical" label="Mission Failure Triggers" />
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      <li>Crew Health drops to 0% from O₂ depletion (≤ 0.5 kg) or starvation.</li>
                      <li>Cabin CO₂ climbs to toxic concentration (≥ 20,000 ppm).</li>
                      <li>Total potable water depletion (≤ 0.5 L) or prolonged unheated blackout.</li>
                      <li>Cumulative crew radiation dose reaches 250 mSv emergency limit.</li>
                    </ul>
                  </div>
                </div>
              </MobileAccordionBox>

              {/* Pre-Mission Briefing Box */}
              <div className="p-4 rounded border border-cyan-500/30 bg-cyan-950/15 space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300">
                  Pre-Mission Commander Checklist (First 60 Seconds)
                </h3>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                  <li>
                    Open <strong>04. Crops</strong> and plant empty{' '}
                    <strong>Bay 03</strong> immediately so crops mature in Week 2–3.
                  </li>
                  <li>
                    Open <strong>03. Radiation</strong> and stack{' '}
                    <strong>+450 kg Regolith Berms</strong> (free local lunar soil shielding).
                  </li>
                  <li>
                    Confirm <strong>02. Power</strong> is on{' '}
                    <strong>Crew Survival First</strong> so P1 Life Support stays protected.
                  </li>
                </ol>
              </div>

              <ExploreMoreSection
                topic="A. Lunar Missions and Habitats"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 2: UNDERSTANDING THE INTERFACE */}
          {activeSection === 'ch2-interface' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <p className="text-sm">
                Every indicator on the Space Command console maps directly to real engineering
                telemetry. Use this visual map to locate controls quickly on both desktop and mobile.
              </p>

              {/* Labelled Interface Diagram matching real UI */}
              <MobileAccordionBox
                title="Labelled Console Layout Map"
                subtitle="Tap to expand cockpit topology diagram"
                defaultOpenMobile={false}
              >
                <div className="space-y-3">
                  <svg
                    viewBox="0 0 720 290"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Labelled diagram of Space Command Top Navigation, Telemetry Ribbon, KPI Cards, Subsystem Matrix, Alerts, and Charts"
                  >
                    {/* Top Bar */}
                    <rect x="10" y="10" width="700" height="36" rx="4" fill="#0F172A" stroke="#334155" />
                    <text x="24" y="32" fill="#F1F5F9" fontSize="11" fontWeight="600">
                      Space Command
                    </text>
                    <text x="200" y="32" fill="#67E8F9" fontSize="10">
                      Mission Control · Subsystems · Lunar Surface · Mission Report · Handbook
                    </text>
                    <rect x="612" y="17" width="88" height="22" rx="3" fill="#22D3EE" />
                    <text x="656" y="32" textAnchor="middle" fill="#0F172A" fontSize="10" fontWeight="700">
                      New Mission
                    </text>

                    {/* Telemetry Ribbon */}
                    <rect x="10" y="52" width="700" height="32" rx="4" fill="#070B14" stroke="#1E293B" />
                    <text x="24" y="72" fill="#CBD5E1" fontSize="10" fontFamily="monospace">
                      Day 01 · 00:00 / 30d · Nominal · Crew 4/4 · Health 100%
                    </text>
                    <rect x="470" y="58" width="230" height="20" rx="3" fill="#0F172A" stroke="#334155" />
                    <text x="585" y="72" textAnchor="middle" fill="#67E8F9" fontSize="10" fontFamily="monospace">
                      Pause/Resume | +1h | +6h | +1d
                    </text>

                    {/* Mission Progress */}
                    <rect x="10" y="94" width="700" height="34" rx="4" fill="#0D1322" stroke="#1E293B" />
                    <text x="24" y="114" fill="#E2E8F0" fontSize="10" fontWeight="600">
                      Outpost Overview · Shackleton Crater Rim · 30-Day Progress Bar
                    </text>

                    {/* 4 KPI Cards */}
                    <rect x="10" y="138" width="166" height="52" rx="4" fill="#0D1322" stroke="#06B6D4" />
                    <text x="22" y="157" fill="#94A3B8" fontSize="9">
                      Crew Health & Morale
                    </text>
                    <text x="22" y="176" fill="#F1F5F9" fontSize="13" fontWeight="700">
                      100%
                    </text>

                    <rect x="188" y="138" width="166" height="52" rx="4" fill="#0D1322" stroke="#1E293B" />
                    <text x="200" y="157" fill="#94A3B8" fontSize="9">
                      Oxygen & CO2
                    </text>
                    <text x="200" y="176" fill="#F1F5F9" fontSize="13" fontWeight="700">
                      62.0 kg O2
                    </text>

                    <rect x="366" y="138" width="166" height="52" rx="4" fill="#0D1322" stroke="#1E293B" />
                    <text x="378" y="157" fill="#94A3B8" fontSize="9">
                      Battery & Solar Grid
                    </text>
                    <text x="378" y="176" fill="#F1F5F9" fontSize="13" fontWeight="700">
                      96.0 kWh
                    </text>

                    <rect x="544" y="138" width="166" height="52" rx="4" fill="#0D1322" stroke="#1E293B" />
                    <text x="556" y="157" fill="#94A3B8" fontSize="9">
                      Water, Food & Radiation
                    </text>
                    <text x="556" y="176" fill="#F1F5F9" fontSize="13" fontWeight="700">
                      240 L · 60 kg
                    </text>

                    {/* Bottom Split */}
                    <rect x="10" y="200" width="290" height="80" rx="4" fill="#0D1322" stroke="#334155" />
                    <text x="24" y="220" fill="#67E8F9" fontSize="10" fontWeight="600">
                      5-Subsystem Matrix + Active Alerts
                    </text>
                    <text x="24" y="238" fill="#94A3B8" fontSize="9">
                      Click any row or Alert Inspect link
                    </text>
                    <text x="24" y="254" fill="#94A3B8" fontSize="9">
                      to jump straight to controls
                    </text>

                    <rect x="314" y="200" width="396" height="80" rx="4" fill="#0D1322" stroke="#334155" />
                    <text x="328" y="220" fill="#67E8F9" fontSize="10" fontWeight="600">
                      72-Hour Multi-Channel Telemetry Chart
                    </text>
                    <polyline
                      points="335,260 390,248 450,254 520,235 590,242 680,228"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="2"
                    />
                    <polyline
                      points="335,266 390,264 450,258 520,255 590,250 680,246"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </MobileAccordionBox>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Navigation & Top Telemetry Ribbon
                  </h3>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>5 Primary Screens:</strong> Mission Control (overview), Subsystems
                      (01–05 controls), Lunar Surface (2D rover map), Mission Report (live score &
                      decision log), and Mission Handbook. On mobile, tap the top-right menu icon.
                    </li>
                    <li>
                      <strong>Mission Timer:</strong> Shows Day, Hour, and overall status (Nominal /
                      Caution / Critical Alert).
                    </li>
                    <li>
                      <strong>Time Controls:</strong> Use <strong>Resume/Pause</strong> for 1 hour
                      per second, or step <strong>+1h</strong>, <strong>+6h</strong>,{' '}
                      <strong>+1d (24h)</strong>. Fast jumps auto-pause at the exact hour a Solar
                      Particle Event or critical alert occurs!
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    KPI Cards, Health & Alerts
                  </h3>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>
                      <strong>Resource Indicators:</strong> Track Oxygen (kg), CO₂ (ppm), Battery
                      (kWh vs kW), Water (L), Food (kg), and Cumulative Radiation (mSv).
                    </li>
                    <li>
                      <strong>Equipment Health:</strong> Scrubber, Water Recycler, Battery Bank,
                      Greenhouse, and Rover Wheels show percentage health and degrade with wear.
                    </li>
                    <li>
                      <strong>Alerts & Decision Feedback:</strong> Active Alerts explain what broke
                      and offer a one-click <strong>Inspect</strong> jump. Every control change
                      logs a cause-and-effect banner explaining how subsystems reacted.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* CHAPTER 3: LIFE SUPPORT & ATMOSPHERE CONTROL */}
          {activeSection === 'ch3-life-support' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  Life Support (ECLSS) keeps 4 astronauts breathing inside a sealed{' '}
                  <strong>180 m³</strong> habitat at <strong>21.2 kPa O₂</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => onJumpToSubsystem('life-support')}
                  className="min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  Open 01. Life Support →
                </button>
              </div>

              {/* Resource Flow SVG */}
              <MobileAccordionBox
                title="ECLSS Resource Flow & Electrolysis Diagram"
                subtitle="2H₂O → 2H₂ + O₂ reaction loop"
                defaultOpenMobile={true}
              >
                <div className="space-y-2.5">
                  <svg
                    viewBox="0 0 680 145"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Diagram of Water Distillation Recycler feeding Electrolysis 2H2O to 2H2 plus O2 and CO2 Amine Scrubber"
                  >
                    <rect x="10" y="15" width="145" height="50" rx="5" fill="#0F172A" stroke="#3B82F6" />
                    <text x="82" y="37" textAnchor="middle" fill="#93C5FD" fontSize="11" fontWeight="600">
                      Potable Water Tank
                    </text>
                    <text x="82" y="53" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      240 L initial · 1.125 L/kg O₂
                    </text>

                    <rect x="200" y="15" width="215" height="50" rx="5" fill="#0F172A" stroke="#06B6D4" />
                    <text x="307" y="36" textAnchor="middle" fill="#67E8F9" fontSize="11" fontWeight="600">
                      Electrolysis: 2H₂O → 2H₂ + O₂
                    </text>
                    <text x="307" y="53" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      5.8 kWh/kg O₂ · Balanced ~0.145 kg/h
                    </text>

                    <rect x="460" y="15" width="210" height="50" rx="5" fill="#0F172A" stroke="#10B981" />
                    <text x="565" y="36" textAnchor="middle" fill="#6EE7B7" fontSize="11" fontWeight="600">
                      Cabin Air & 4 Astronauts
                    </text>
                    <text x="565" y="53" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      -0.84 kg O₂/person/d · +1.0 kg CO₂/d
                    </text>

                    <rect x="200" y="85" width="215" height="48" rx="5" fill="#0F172A" stroke="#F59E0B" />
                    <text x="307" y="105" textAnchor="middle" fill="#FDE68A" fontSize="11" fontWeight="600">
                      CO₂ Amine Scrubber (1.0 kW)
                    </text>
                    <text x="307" y="121" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Keeps cabin CO₂ &lt; 2,000 ppm
                    </text>

                    <rect x="10" y="85" width="145" height="48" rx="5" fill="#0F172A" stroke="#38BDF8" />
                    <text x="82" y="105" textAnchor="middle" fill="#BAE6FD" fontSize="11" fontWeight="600">
                      Water Recycler (1.1 kW)
                    </text>
                    <text x="82" y="121" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Up to 94% crew + 55% crop H₂O
                    </text>

                    <line x1="155" y1="40" x2="200" y2="40" stroke="#3B82F6" strokeWidth="1.5" />
                    <line x1="415" y1="40" x2="460" y2="40" stroke="#10B981" strokeWidth="1.5" />
                    <line x1="565" y1="65" x2="415" y2="109" stroke="#F59E0B" strokeWidth="1.5" />
                    <line x1="82" y1="85" x2="82" y2="65" stroke="#38BDF8" strokeWidth="1.5" />
                  </svg>
                  <p className="text-slate-300">
                    <strong>Chemical Reaction Explained:</strong>{' '}
                    <span className="font-mono text-cyan-300">2H₂O → 2H₂ + O₂</span> splits two liquid
                    water molecules using electric current into hydrogen gas and breathable oxygen gas.
                  </p>
                </div>
              </MobileAccordionBox>

              {/* Worked Numerical Example */}
              <MobileAccordionBox
                title="Worked Example: Daily Oxygen & Water Budget"
                subtitle="3.36 kg O₂ · 3.78 L H₂O · 19.5 kWh/day"
              >
                <div className="space-y-2">
                  <div className="font-mono text-xs space-y-1 text-slate-200">
                    <p>1. Metabolic O₂ Demand = 4 crew × 0.84 kg/person/day = 3.36 kg O₂/day (0.14 kg/h)</p>
                    <p>2. Water needed in Balanced Electrolysis = 3.36 kg × 1.125 L/kg = 3.78 L H₂O/day</p>
                    <p>3. Electricity needed = 3.36 kg × 5.8 kWh/kg = 19.49 kWh/day (~0.81 kW continuous)</p>
                  </div>
                  <p className="text-slate-400">
                    Switching Electrolysis to <strong>Boost</strong> rebuilds empty O₂ tanks faster but
                    consumes extra water and battery power.
                  </p>
                </div>
              </MobileAccordionBox>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-amber-500/30 bg-amber-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-amber-300">
                    Emergency Scenario: Rising CO₂ Alert
                  </h3>
                  <p>
                    <strong>Situation:</strong> CO₂ crosses 5,000 ppm because the CO₂ Amine Scrubber
                    health dropped to 55% or lost power.{' '}
                    <strong>Action:</strong> Click <strong>Service</strong> on the scrubber, ensure
                    Power Priority is <strong>Crew Survival First (P1)</strong>, and temporarily set
                    Crew Activity to <strong>Resting</strong>.
                  </p>
                </div>
                <div className="p-4 rounded border border-rose-500/30 bg-rose-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-rose-300">
                    Common Mistakes to Avoid
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Leaving Electrolysis on <strong>Off</strong> until main O₂ drops below 10 kg.</li>
                    <li>Turning off the <strong>Water Distillation Recycler</strong> to save 1.1 kW (loses 11.2 L/day!).</li>
                    <li>Running <strong>Boost</strong> electrolysis when water tanks are already under 40 L.</li>
                  </ul>
                </div>
              </div>

              <ExploreMoreSection
                topic="B. Life Support and Atmosphere Control"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 4: POWER GRID & ENERGY MANAGEMENT */}
          {activeSection === 'ch4-power' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  Surface Power converts sunlight into electricity (kW) and stores surplus energy
                  (kWh) in a 120 kWh lithium-ion battery bank at 92% round-trip efficiency.
                </p>
                <button
                  type="button"
                  onClick={() => onJumpToSubsystem('power')}
                  className="min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  Open 02. Surface Power →
                </button>
              </div>

              {/* kW vs kWh Worked Example */}
              <MobileAccordionBox
                title="Power (kW) vs. Energy (kWh) Explained"
                subtitle="Rate vs total stored energy over time"
                defaultOpenMobile={true}
              >
                <div className="space-y-2">
                  <p>
                    <strong>Power (kW)</strong> is the <em>instantaneous rate</em> of electricity flow
                    right now. <strong>Energy (kWh)</strong> is the <em>total amount</em> generated,
                    stored, or used over time (<span className="font-mono text-slate-100">Energy = Power × Hours</span>).
                  </p>
                  <div className="font-mono text-xs text-slate-100 bg-[#080D19] p-3 rounded border border-slate-800">
                    Example: Habitat Thermal (2.4 kW) + Life Support (2.9 kW) = 5.3 kW continuous load.
                    Over a 10-hour crater shadow: 5.3 kW × 10 h = 53.0 kWh drawn from your 120 kWh battery.
                  </div>
                </div>
              </MobileAccordionBox>

              {/* Energy Flow SVG */}
              <MobileAccordionBox
                title="Outpost Electrical Grid & Priority Diagram"
                subtitle="P1 Life Support down to P4 Rover Dock"
              >
                <svg
                  viewBox="0 0 680 140"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Solar arrays charge 120 kWh battery bank at 92 percent efficiency and feed P1 Life Support, P2 Thermal, P3 Greenhouse, and P4 Rover"
                >
                  <rect x="10" y="38" width="145" height="60" rx="5" fill="#0F172A" stroke="#F59E0B" />
                  <text x="82" y="62" textAnchor="middle" fill="#FDE68A" fontSize="11" fontWeight="600">
                    18 kW Solar Array
                  </text>
                  <text x="82" y="80" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    Site Sun % × Dust Loss
                  </text>

                  <rect x="200" y="38" width="160" height="60" rx="5" fill="#0F172A" stroke="#06B6D4" />
                  <text x="280" y="62" textAnchor="middle" fill="#67E8F9" fontSize="11" fontWeight="600">
                    120 kWh Battery Bus
                  </text>
                  <text x="280" y="80" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    92% round-trip efficiency
                  </text>

                  <rect x="415" y="10" width="255" height="25" rx="4" fill="#0F172A" stroke="#10B981" />
                  <text x="542" y="26" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="600">
                    P1: Life Support (~2.9 kW) — Protected
                  </text>
                  <rect x="415" y="41" width="255" height="25" rx="4" fill="#0F172A" stroke="#38BDF8" />
                  <text x="542" y="57" textAnchor="middle" fill="#BAE6FD" fontSize="10">
                    P2: Habitat Thermal (2.4 kW)
                  </text>
                  <rect x="415" y="72" width="255" height="25" rx="4" fill="#0F172A" stroke="#94A3B8" />
                  <text x="542" y="88" textAnchor="middle" fill="#CBD5E1" fontSize="10">
                    P3: Greenhouse LEDs (0–4.7 kW)
                  </text>
                  <rect x="415" y="103" width="255" height="25" rx="4" fill="#0F172A" stroke="#64748B" />
                  <text x="542" y="119" textAnchor="middle" fill="#94A3B8" fontSize="10">
                    P4: Rover Dock (2.5 kW) — Shed First
                  </text>

                  <line x1="155" y1="68" x2="200" y2="68" stroke="#F59E0B" strokeWidth="1.5" />
                  <line x1="360" y1="54" x2="415" y2="23" stroke="#10B981" strokeWidth="1.5" />
                  <line x1="360" y1="62" x2="415" y2="54" stroke="#38BDF8" strokeWidth="1.5" />
                  <line x1="360" y1="72" x2="415" y2="85" stroke="#94A3B8" strokeWidth="1.2" />
                  <line x1="360" y1="80" x2="415" y2="115" stroke="#64748B" strokeWidth="1.2" />
                </svg>
              </MobileAccordionBox>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-amber-500/30 bg-amber-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-amber-300">
                    Power-Shortage Scenario: Polar Eclipse Approaching
                  </h3>
                  <p>
                    <strong>Situation:</strong> The 72-Hour Forecast shows 0 kW solar for the next
                    36 hours, battery is 45 kWh, and Dust Loss is 22%.{' '}
                    <strong>Action:</strong> Click <strong>Clean Solar Arrays</strong> before
                    eclipse, switch Greenhouse LEDs to <strong>50%</strong>, pause Rover Dock
                    charging, and keep <strong>Crew Survival First</strong> active.
                  </p>
                </div>
                <div className="p-4 rounded border border-rose-500/30 bg-rose-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-rose-300">
                    Common Mistakes to Avoid
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ignoring the 72-Hour Illumination Forecast before starting +1d jumps.</li>
                    <li>Leaving <strong>Prioritize Rover Fast-Charge</strong> active during shadow dips.</li>
                    <li>Forgetting to clean electrostatic dust off solar panels after 20%+ loss.</li>
                  </ul>
                </div>
              </div>

              <ExploreMoreSection
                topic="C. Power and Energy Management"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 5: RADIATION PROTECTION & HABITAT SAFETY */}
          {activeSection === 'ch5-radiation' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  Because the Moon has no thick atmosphere or magnetic field, astronauts absorb
                  ionizing radiation measured in <strong>millisieverts (mSv)</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => onJumpToSubsystem('radiation')}
                  className="min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  Open 03. Radiation Safety →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-1.5">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Galactic Cosmic Rays (GCR)
                  </h3>
                  <p>
                    Constant background radiation from outside our solar system (
                    <strong>0.015 mSv/h</strong> unshielded, ~0.36 mSv/day). Heavy shielding reduces
                    GCR gradually over all 30 days.
                  </p>
                </div>
                <div className="p-4 rounded border border-amber-500/40 bg-amber-950/20 space-y-1.5">
                  <h3 className="text-sm font-semibold text-amber-300">
                    Solar Particle Events (SPE)
                  </h3>
                  <p>
                    Sudden proton storms from solar flares surging to{' '}
                    <strong>~0.58 mSv/h</strong> (&gt;35× background!). The outpost detects an SPE{' '}
                    <strong>5 hours in advance</strong> and auto-pauses multi-hour jumps.
                  </p>
                </div>
              </div>

              {/* Radiation Protection SVG */}
              <MobileAccordionBox
                title="Multi-Layer Habitat Shielding & Storm Shelter Attenuation"
                subtitle="Tap to view shielding layer diagram"
                defaultOpenMobile={false}
              >
                <div className="space-y-2.5">
                  <svg
                    viewBox="0 0 680 140"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Diagram of GCR and SPE particles passing through Regolith Berm, Aluminium Hull, Water Wall Bladders, and Inner Storm Shelter"
                  >
                    <text x="15" y="45" fill="#F59E0B" fontSize="10" fontWeight="600">
                      GCR (0.015 mSv/h)
                    </text>
                    <text x="15" y="88" fill="#EF4444" fontSize="10" fontWeight="600">
                      SPE (~0.58 mSv/h)
                    </text>
                    <line x1="125" y1="42" x2="175" y2="42" stroke="#F59E0B" strokeWidth="2" />
                    <line x1="125" y1="84" x2="175" y2="84" stroke="#EF4444" strokeWidth="3" />

                    <rect x="180" y="15" width="110" height="105" rx="4" fill="#1E293B" stroke="#10B981" />
                    <text x="235" y="55" textAnchor="middle" fill="#6EE7B7" fontSize="10" fontWeight="600">
                      Regolith Berm
                    </text>
                    <text x="235" y="72" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      +450 kg local soil
                    </text>
                    <text x="235" y="88" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Zero launch mass
                    </text>

                    <rect x="298" y="15" width="105" height="105" rx="4" fill="#0F172A" stroke="#94A3B8" />
                    <text x="350" y="55" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="600">
                      Aluminium Hull
                    </text>
                    <text x="350" y="72" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      3,200 kg alloy
                    </text>

                    <rect x="411" y="15" width="115" height="105" rx="4" fill="#0F172A" stroke="#06B6D4" />
                    <text x="468" y="55" textAnchor="middle" fill="#67E8F9" fontSize="10" fontWeight="600">
                      Water Wall
                    </text>
                    <text x="468" y="72" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      ~2x proton stop/kg
                    </text>
                    <text x="468" y="88" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      40 L tank floor
                    </text>

                    <rect x="534" y="25" width="136" height="85" rx="6" fill="#082F49" stroke="#22D3EE" />
                    <text x="602" y="58" textAnchor="middle" fill="#ECFEFF" fontSize="10" fontWeight="700">
                      Storm Shelter Core
                    </text>
                    <text x="602" y="76" textAnchor="middle" fill="#67E8F9" fontSize="9">
                      -82% extra dose rate
                    </text>
                    <text x="602" y="92" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      +0.5 kW shelter power
                    </text>
                  </svg>
                  <p className="text-slate-300">
                    <strong>Why Water Works So Well:</strong> Hydrogen atoms in water match the mass
                    of incoming solar protons, slowing them efficiently without producing heavy
                    secondary fragments that dense metals like lead or thick aluminium can scatter.
                  </p>
                </div>
              </MobileAccordionBox>

              <div className="p-4 rounded border border-amber-500/40 bg-amber-950/20 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Emergency Scenario & Simplified-Model Disclaimer</span>
                </div>
                <p>
                  <strong>Emergency Action:</strong> When an SPE Warning appears, immediately click{' '}
                  <strong>Enter Storm Shelter</strong> in 03. Radiation Safety and wait until the
                  storm clears. Stay well below <strong>50 mSv caution</strong> and never reach{' '}
                  <strong>250 mSv failure</strong>.
                </p>
                <p className="text-slate-400">
                  <strong>Educational Scope Disclaimer:</strong> This attenuation math is a
                  simplified educational approximation—it is <em>not</em> a medical dose predictor or
                  flight-certified NASA radiation transport model.
                </p>
              </div>

              <ExploreMoreSection
                topic="D. Radiation Protection"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 6: FOOD PRODUCTION & GREENHOUSE */}
          {activeSection === 'ch6-agriculture' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  You start with <strong>60 kg packaged rations</strong>—only{' '}
                  <strong>~24.2 days</strong> of food at 2.48 kg/day for 4 astronauts. Harvesting
                  hydroponic crops in Bays 01–03 closes the Week 4 food gap.
                </p>
                <button
                  type="button"
                  onClick={() => onJumpToSubsystem('agriculture')}
                  className="min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  Open 04. Food & Water →
                </button>
              </div>

              {/* Hydroponics & Photosynthesis SVG */}
              <MobileAccordionBox
                title="Hydroponic Tray Cycle & Photosynthesis Explained"
                subtitle="Tap to view tray schematic & gas balance"
                defaultOpenMobile={false}
              >
                <div className="space-y-2.5">
                  <svg
                    viewBox="0 0 680 135"
                    className="w-full h-auto"
                    role="img"
                    aria-label="Hydroponics LED array illuminates crops in nutrient water, producing biomass and 55 percent recycled transpiration water"
                  >
                    <rect x="10" y="15" width="150" height="48" rx="5" fill="#0F172A" stroke="#F59E0B" />
                    <text x="85" y="36" textAnchor="middle" fill="#FDE68A" fontSize="11" fontWeight="600">
                      LED Lighting (0–100%)
                    </text>
                    <text x="85" y="52" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Drives photosynthesis speed
                    </text>

                    <rect x="10" y="75" width="150" height="48" rx="5" fill="#0F172A" stroke="#3B82F6" />
                    <text x="85" y="96" textAnchor="middle" fill="#93C5FD" fontSize="11" fontWeight="600">
                      Water + Nutrients
                    </text>
                    <text x="85" y="112" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Eco (-18%) / Std / Rich (+15%)
                    </text>

                    <rect x="215" y="25" width="210" height="88" rx="6" fill="#0F172A" stroke="#10B981" />
                    <text x="320" y="50" textAnchor="middle" fill="#6EE7B7" fontSize="11" fontWeight="600">
                      Hydroponic Bays 01–03
                    </text>
                    <text x="320" y="70" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace">
                      6CO₂ + 6H₂O + Light → Biomass + 6O₂
                    </text>
                    <text x="320" y="92" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      7–14 days growth · Harvest when 100%
                    </text>

                    <rect x="475" y="15" width="195" height="48" rx="5" fill="#0F172A" stroke="#22D3EE" />
                    <text x="572" y="36" textAnchor="middle" fill="#67E8F9" fontSize="11" fontWeight="600">
                      Edible Food + Morale
                    </text>
                    <text x="572" y="52" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      2.6 to 8.2 kg dry-eq per bay
                    </text>

                    <rect x="475" y="75" width="195" height="48" rx="5" fill="#0F172A" stroke="#38BDF8" />
                    <text x="572" y="96" textAnchor="middle" fill="#BAE6FD" fontSize="11" fontWeight="600">
                      55% Vapor Recovery
                    </text>
                    <text x="572" y="112" textAnchor="middle" fill="#94A3B8" fontSize="9">
                      Captured by Water Recycler
                    </text>

                    <line x1="160" y1="39" x2="215" y2="55" stroke="#F59E0B" strokeWidth="1.5" />
                    <line x1="160" y1="99" x2="215" y2="85" stroke="#3B82F6" strokeWidth="1.5" />
                    <line x1="425" y1="55" x2="475" y2="39" stroke="#22D3EE" strokeWidth="1.5" />
                    <line x1="425" y1="85" x2="475" y2="99" stroke="#38BDF8" strokeWidth="1.5" />
                  </svg>
                  <p className="text-slate-300">
                    <strong>Why Mechanical ECLSS Still Handles Cabin Air:</strong> While photosynthesis
                    absorbs CO₂ and emits O₂, growing enough crops to supply 100% of 4 astronauts’
                    oxygen requires hundreds of square meters of plants. Here, 3 compact bays
                    supplement food, lift crew morale, and return 55% of irrigation water via
                    transpiration capture.
                  </p>
                </div>
              </MobileAccordionBox>

              {/* Plant Growth Timeline from CROP_CATALOG */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  In-Game Crop Catalog & Growth Timeline
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.keys(CROP_CATALOG) as CropType[]).map((key) => {
                    const crop = CROP_CATALOG[key];
                    return (
                      <div
                        key={crop.id}
                        className="p-3.5 rounded border border-slate-800 bg-slate-900/45 space-y-1"
                      >
                        <p className="text-xs font-semibold text-cyan-300">{crop.name}</p>
                        <p className="font-mono tabular-nums text-[11px] text-slate-200">
                          {(crop.growthHours / 24).toFixed(0)} days ({crop.growthHours}h) ·{' '}
                          {crop.yieldDryKg} kg yield
                        </p>
                        <p className="font-mono tabular-nums text-[11px] text-slate-400">
                          {crop.waterLitresPerHour} L/h · {crop.powerKwAtFullLight} kW @ 100%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-amber-500/30 bg-amber-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-amber-300">
                    Food-Shortage Scenario (Week 3)
                  </h3>
                  <p>
                    <strong>Situation:</strong> Packaged rations dip under 20 kg with 9 days left.{' '}
                    <strong>Action:</strong> Plant fast <strong>Outredgeous Lettuce</strong> (7
                    days) or <strong>Cherry Belle Radish</strong> (9 days) at 100% LEDs with Rich
                    nutrients, and click <strong>Calibrate</strong> so root health stays 100%.
                  </p>
                </div>
                <div className="p-4 rounded border border-rose-500/30 bg-rose-950/15 space-y-1.5">
                  <h3 className="text-sm font-semibold text-rose-300">Common Mistakes to Avoid</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Leaving Bay 03 empty for the first 10 days of the mission.</li>
                    <li>Leaving LED lighting at 0% for multiple days (causes crop failure).</li>
                    <li>Ignoring Greenhouse Health warnings instead of clicking Calibrate.</li>
                  </ul>
                </div>
              </div>

              <ExploreMoreSection
                topic="E. Space Agriculture"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 7: LUNAR ROVER & RESOURCE EXPLORATION */}
          {activeSection === 'ch7-rover' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  The robotic rover scouts craters around Outpost Base (0, 0) within a{' '}
                  <strong>12 km direct-radio horizon</strong> using a{' '}
                  <strong>45 kWh</strong> onboard battery.
                </p>
                <button
                  type="button"
                  onClick={() => onJumpToSubsystem('rover')}
                  className="min-h-[40px] sm:min-h-0 px-3 py-1.5 text-xs font-medium rounded border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 cursor-pointer"
                >
                  Open 05. Lunar Surface →
                </button>
              </div>

              {/* Labelled Rover SVG */}
              <MobileAccordionBox
                title="Rover Hardware, Comms Horizon & Route Comparison"
                subtitle="Tap to view hardware & terrain diagram"
                defaultOpenMobile={false}
              >
                <svg
                  viewBox="0 0 680 155"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Labelled diagram of Lunar Rover battery, high-gain comms antenna, core drill, and mesh wheels navigating around crater hazards"
                >
                  {/* Outpost & Comms Ring */}
                  <rect x="20" y="55" width="76" height="44" rx="4" fill="#0F172A" stroke="#06B6D4" />
                  <text x="58" y="75" textAnchor="middle" fill="#67E8F9" fontSize="10" fontWeight="600">
                    Outpost Dock
                  </text>
                  <text x="58" y="90" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
                    2.5 kW charge
                  </text>

                  {/* Routes */}
                  <line x1="96" y1="77" x2="295" y2="77" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 4" />
                  <text x="195" y="70" textAnchor="middle" fill="#FDE68A" fontSize="9">
                    Direct (hits crater rim)
                  </text>
                  <path d="M 96 77 Q 195 140 295 77" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="4 3" />
                  <text x="195" y="128" textAnchor="middle" fill="#67E8F9" fontSize="9">
                    Safe Detour (+15% path, low wear)
                  </text>

                  {/* Hazard Crater */}
                  <circle cx="195" cy="77" r="18" fill="#04070E" stroke="#64748B" />
                  <text x="195" y="80" textAnchor="middle" fill="#64748B" fontSize="8">
                    CRATER
                  </text>

                  {/* Rover Diagram */}
                  <rect x="335" y="42" width="160" height="58" rx="6" fill="#0F172A" stroke="#F59E0B" />
                  <text x="415" y="64" textAnchor="middle" fill="#FDE68A" fontSize="11" fontWeight="600">
                    45 kWh Rover Chassis
                  </text>
                  <text x="415" y="80" textAnchor="middle" fill="#CBD5E1" fontSize="9">
                    1.35 kWh/km · 3.5 km/h nominal
                  </text>
                  <circle cx="360" cy="108" r="9" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                  <circle cx="415" cy="108" r="9" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                  <circle cx="470" cy="108" r="9" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                  <line x1="455" y1="42" x2="455" y2="20" stroke="#22D3EE" strokeWidth="2" />
                  <circle cx="455" cy="17" r="4" fill="#22D3EE" />
                  <text x="470" y="21" fill="#67E8F9" fontSize="9">
                    12 km Comms Antenna
                  </text>

                  {/* Core Drill / Prospect */}
                  <rect x="520" y="38" width="145" height="66" rx="5" fill="#0F172A" stroke="#38BDF8" />
                  <text x="592" y="60" textAnchor="middle" fill="#BAE6FD" fontSize="10" fontWeight="600">
                    Core Drill (-1.8 kWh)
                  </text>
                  <text x="592" y="76" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
                    Maps ice prospects only
                  </text>
                  <text x="592" y="92" textAnchor="middle" fill="#94A3B8" fontSize="8.5">
                    (Needs separate ISRU plant)
                  </text>
                </svg>
              </MobileAccordionBox>

              {/* Direct vs Safe Detour Numerical Comparison */}
              <div className="p-4 rounded border border-cyan-500/30 bg-cyan-950/15 space-y-2">
                <h3 className="text-sm font-semibold text-cyan-300">
                  Route Comparison Example: Shackleton Rim Ridge (~6.7 km, 1.35x terrain)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded border border-slate-800 bg-[#080D19] space-y-1">
                    <p className="text-amber-300 font-semibold">Direct Traverse</p>
                    <p>Distance: ~6.7 km one-way (~2 h)</p>
                    <p>Round-trip energy: ~24.4 kWh</p>
                    <p className="text-amber-400">Crosses crater rim → higher wheel wear</p>
                  </div>
                  <div className="p-3 rounded border border-slate-800 bg-[#080D19] space-y-1">
                    <p className="text-cyan-300 font-semibold">Safe Crater Detour (Recommended)</p>
                    <p>Distance: ~7.7 km one-way (+15%, ~3 h)</p>
                    <p>Round-trip energy: ~26.6 kWh (+2.2 kWh)</p>
                    <p className="text-emerald-400">Avoids crater rim → protects mobility</p>
                  </div>
                </div>
              </div>

              {/* Critical ISRU Clarification */}
              <div className="p-4 rounded border border-slate-800 bg-slate-900/45 space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-100">
                  Important Science Rule: Why Discovered Water-Ice ≠ Instant Drinking Water
                </h3>
                <p>
                  Confirming water-ice at <em>PSR Frost Prospect Alpha</em> or{' '}
                  <em>De Gerlache Ice Trench</em> maps future <strong>ISRU</strong> deposits—it does{' '}
                  <strong>not</strong> add litres to habitat water tanks. Real lunar ice sits inside
                  cryogenic regolith (-200°C) and requires dedicated mining rovers, thermal
                  ovens, vapor condensers, filtration, and high electrical power to become potable
                  water.
                </p>
              </div>

              {/* Safe Return Checklist */}
              <div className="p-4 rounded border border-slate-800 bg-slate-900/45 space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-100">
                  Safe-Return & Dispatch Checklist
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>92% Return Margin:</strong> Outpost requires rover battery ≥ 92% of
                    estimated round-trip energy before dispatch.
                  </li>
                  <li>
                    <strong>Sample Reserve:</strong> Keep at least 1.8 kWh per core sample plus
                    enough battery to drive home without hitting 0 kWh (stranded!).
                  </li>
                  <li>
                    <strong>Wheel Service:</strong> Click <strong>Service Wheels</strong> while
                    docked if mobility drops below 70%.
                  </li>
                </ul>
              </div>

              <ExploreMoreSection
                topic="F. Lunar Rover and Resource Exploration"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 8: RESOURCE MANAGEMENT & INTERCONNECTED SYSTEMS */}
          {activeSection === 'ch8-interconnected' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <p className="text-sm">
                The core engineering lesson of Space Command is <strong>system coupling</strong>:
                changing one control always creates secondary effects elsewhere in the outpost.
              </p>

              {/* System Coupling SVG Diagram */}
              <MobileAccordionBox
                title="How All Five Outpost Subsystems Depend on Each Other"
                subtitle="Tap to view subsystem coupling diagram"
                defaultOpenMobile={false}
              >
                <svg
                  viewBox="0 0 680 185"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Diagram connecting Surface Power, Life Support, Radiation Safety, Greenhouse, and Rover via electricity, water, and crew protection"
                >
                  <rect x="15" y="62" width="140" height="60" rx="6" fill="#0F172A" stroke="#06B6D4" />
                  <text x="85" y="88" textAnchor="middle" fill="#67E8F9" fontSize="11" fontWeight="600">
                    02. Surface Power
                  </text>
                  <text x="85" y="106" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    Solar + 120 kWh Grid
                  </text>

                  <rect x="235" y="12" width="165" height="58" rx="6" fill="#0F172A" stroke="#38BDF8" />
                  <text x="317" y="36" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
                    01. Life Support
                  </text>
                  <text x="317" y="53" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    O₂, CO₂ Scrubber & WRS
                  </text>

                  <rect x="235" y="114" width="165" height="58" rx="6" fill="#0F172A" stroke="#10B981" />
                  <text x="317" y="138" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
                    04. Greenhouse
                  </text>
                  <text x="317" y="155" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    LED + H₂O → Food + 55% H₂O
                  </text>

                  <rect x="485" y="12" width="175" height="58" rx="6" fill="#0F172A" stroke="#F59E0B" />
                  <text x="572" y="36" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
                    03. Radiation Safety
                  </text>
                  <text x="572" y="53" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    Water Wall + Shelter (+0.5kW)
                  </text>

                  <rect x="485" y="114" width="175" height="58" rx="6" fill="#0F172A" stroke="#A78BFA" />
                  <text x="572" y="138" textAnchor="middle" fill="#E2E8F0" fontSize="11" fontWeight="600">
                    05. Lunar Rover
                  </text>
                  <text x="572" y="155" textAnchor="middle" fill="#94A3B8" fontSize="9">
                    2.5 kW Dock → ISRU Science
                  </text>

                  <line x1="155" y1="80" x2="235" y2="42" stroke="#06B6D4" strokeWidth="1.6" />
                  <line x1="155" y1="104" x2="235" y2="142" stroke="#06B6D4" strokeWidth="1.6" />
                  <line x1="155" y1="92" x2="485" y2="142" stroke="#64748B" strokeWidth="1.2" strokeDasharray="4 3" />
                  <line x1="317" y1="70" x2="317" y2="114" stroke="#38BDF8" strokeWidth="1.6" />
                  <line x1="400" y1="41" x2="485" y2="41" stroke="#38BDF8" strokeWidth="1.6" strokeDasharray="3 3" />
                </svg>
              </MobileAccordionBox>

              {/* Prioritization Hierarchy */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded border border-emerald-500/30 bg-emerald-950/15 space-y-1.5">
                  <p className="text-xs font-mono uppercase text-emerald-300">Tier 1 · Immediate Survival</p>
                  <p className="text-sm font-semibold text-slate-100">Air, Water & Shelter</p>
                  <p>
                    Breathable O₂, CO₂ scrubbing (&lt; 2,000 ppm), potable water, thermal power, and
                    SPE storm sheltering must never be sacrificed for crops or rover charging.
                  </p>
                </div>
                <div className="p-4 rounded border border-cyan-500/30 bg-cyan-950/15 space-y-1.5">
                  <p className="text-xs font-mono uppercase text-cyan-300">Tier 2 · Long-Term Sustainability</p>
                  <p className="text-sm font-semibold text-slate-100">Food, Shielding & Health</p>
                  <p>
                    Plant Bays 01–03 early, stack regolith berms, clean solar dust, and service
                    scrubber/recycler hardware so Week 4 supplies stay healthy.
                  </p>
                </div>
                <div className="p-4 rounded border border-slate-700 bg-slate-900/45 space-y-1.5">
                  <p className="text-xs font-mono uppercase text-slate-400">Tier 3 · Optional Exploration</p>
                  <p className="text-sm font-semibold text-slate-100">Rover Science & ISRU</p>
                  <p>
                    Dispatch rover sorties when outpost batteries are well-charged and solar
                    sunlight is steady. Pause dock charging during polar eclipses.
                  </p>
                </div>
              </div>

              <ExploreMoreSection
                topic="G. Interconnected Systems and Mission Sustainability"
                onOpenAllResources={() => selectChapter('ch12-resources')}
              />
            </div>
          )}

          {/* CHAPTER 9: EMERGENCY PROCEDURES */}
          {activeSection === 'ch9-emergencies' && (
            <div className="space-y-4 text-xs text-slate-300">
              <p className="text-sm">
                Follow these 10 prioritized emergency checklists whenever a warning or critical alert
                appears. Never turn off Life Support to save power.
              </p>

              {/* Mobile Collapsible Emergency Cards (< md) */}
              <div className="md:hidden space-y-2.5">
                {EMERGENCY_PROCEDURES.map((row, idx) => (
                  <MobileAccordionBox
                    key={row.id}
                    title={row.alert}
                    subtitle={`${row.whereToGo} · ${row.severity.toUpperCase()}`}
                    defaultOpenMobile={idx < 2}
                  >
                    <div className="space-y-1.5">
                      <StatusIndicator level={row.severity} label={row.alert} />
                      <p className="text-slate-200">
                        <strong>Meaning:</strong> {row.meaning}
                      </p>
                      <p className="text-slate-400">
                        <strong>Danger:</strong> {row.whyDangerous}
                      </p>
                      <p className="text-slate-300">
                        <strong>Check First:</strong> {row.checkFirst}
                      </p>
                      <p className="font-mono text-cyan-300">
                        <strong>Module:</strong> {row.whereToGo}
                      </p>
                      <p className="text-slate-100 leading-relaxed">
                        <strong>Actions:</strong> {row.prioritizedActions}
                      </p>
                      <p className="text-rose-300">
                        <strong>Avoid:</strong> {row.mistakesToAvoid}
                      </p>
                    </div>
                  </MobileAccordionBox>
                ))}
              </div>

              {/* Desktop / Tablet Structured Table (md+) */}
              <div className="hidden md:block overflow-x-auto rounded-md border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-300">
                      <th className="py-3 px-3 font-semibold">Emergency & Meaning</th>
                      <th className="py-3 px-3 font-semibold">Check First & Module</th>
                      <th className="py-3 px-3 font-semibold">Prioritized Actions</th>
                      <th className="py-3 px-3 font-semibold">Mistakes to Avoid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {EMERGENCY_PROCEDURES.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/35 align-top">
                        <td className="py-3 px-3 space-y-1 max-w-[240px]">
                          <StatusIndicator level={row.severity} label={row.alert} />
                          <p className="text-slate-300 mt-1">{row.meaning}</p>
                          <p className="text-slate-400">{row.whyDangerous}</p>
                        </td>
                        <td className="py-3 px-3 space-y-1 max-w-[190px]">
                          <span className="font-mono text-cyan-300 block">{row.whereToGo}</span>
                          <span className="text-slate-400 block">{row.checkFirst}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-100 leading-relaxed max-w-[270px]">
                          {row.prioritizedActions}
                        </td>
                        <td className="py-3 px-3 text-rose-300/90 leading-relaxed max-w-[190px]">
                          {row.mistakesToAvoid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CHAPTER 10: SCIENTIFIC GLOSSARY */}
          {activeSection === 'ch10-glossary' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-400">
                  Showing {filteredGlossary.length} of {GLOSSARY_TERMS.length} scientific terms
                </p>
                <div className="flex flex-wrap gap-1 p-1 rounded bg-slate-900 border border-slate-800">
                  {[
                    'All',
                    'Atmosphere',
                    'Energy',
                    'Radiation',
                    'Agriculture',
                    'Exploration',
                    'Environment',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGlossaryCategory(cat)}
                      className={`min-h-[38px] sm:min-h-0 px-2.5 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
                        glossaryCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredGlossary.map((item) => (
                  <GlossaryEntryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* CHAPTER 11: TIPS, STRATEGIES & COMMON MISTAKES */}
          {activeSection === 'ch11-strategy' && (
            <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-300">
                    Beginner Strategy (First 30-Day Win)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Plant Lettuce (7d) or Radish (9d) in Bay 03 on Day 1.</li>
                    <li>Build 3–4 Regolith Berms early in 03. Radiation Safety.</li>
                    <li>Keep Electrolysis on Balanced and Priority on Crew Survival First.</li>
                    <li>Enter Storm Shelter immediately when SPE alerts pause the clock.</li>
                    <li>Only launch short rover sorties when outpost battery &gt; 65%.</li>
                  </ol>
                </div>

                <div className="p-4 rounded border border-cyan-500/30 bg-cyan-950/15 space-y-2">
                  <h3 className="text-sm font-semibold text-cyan-300">
                    Advanced Mission Strategy (90+ Score)
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Stagger Bays 01–03 with Potato (8.2 kg) + Soybean (5.4 kg) harvests.</li>
                    <li>Dim LEDs to 50% and pause Rover Dock right before 36–60h shadows.</li>
                    <li>Pump +60 L into Water Wall once potable tanks exceed 220 L.</li>
                    <li>Survey all 5 lunar sites via Safe Crater Detours to protect wheel health.</li>
                    <li>Test Mare Tranquillitatis (14-day night) with a 180–200 kWh battery bank.</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 rounded border border-slate-800 bg-slate-900/40 space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  10 Essential Survival Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                  <p>1. Never turn off Life Support or Water Recycling during normal operations.</p>
                  <p>2. Plant empty Bay 03 early—60 kg packaged food runs out near Day 24.</p>
                  <p>3. Use Regolith Berms first; keep 40+ L spare tank margin before Water Walls.</p>
                  <p>4. Always enter the Storm Shelter during active Solar Particle Events.</p>
                  <p>5. Check the 72-Hour Solar Forecast before clicking +1d (24h).</p>
                  <p>6. Clean solar arrays whenever dust loss crosses ~15–20%.</p>
                  <p>7. Service CO₂ Scrubber & Water Recycler before health drops below 70%.</p>
                  <p>8. Prefer Safe Crater Detours to keep rover wheels above 70%.</p>
                  <p>9. Remember ice prospects map future ISRU—they do not fill drinking tanks.</p>
                  <p>10. Read the Decision Feedback banner after each change to see system coupling.</p>
                </div>
              </div>

              {/* Simplified Game Model vs Real NASA Table */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  Educational Simulation Model vs. Real NASA Flight Systems
                </h3>
                <div className="overflow-x-auto rounded-md border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-300">
                        <th className="py-2.5 px-3 font-semibold">Subsystem</th>
                        <th className="py-2.5 px-3 font-semibold">Space Command (Educational)</th>
                        <th className="py-2.5 px-3 font-semibold">Real NASA Engineering</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-200">Life Support</td>
                        <td className="py-2.5 px-3">Real 0.84 kg O₂/d & 2.8 L/d baselines in 1h steps.</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          Adds trace-contaminant scrubbing, Sabatier CO₂-to-H₂O loops, and redundancy.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-200">Crops</td>
                        <td className="py-2.5 px-3">Accelerated 7–14 day harvest cycles for 30-day play.</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          Real lettuce takes ~28–35 days; potatoes/soybeans take 70–110+ days.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-200">Radiation</td>
                        <td className="py-2.5 px-3">Simplified exponential areal-density attenuation.</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          3D Monte Carlo transport (OLTARIS) modeling secondary neutron scatter.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-slate-200">ISRU Ice</td>
                        <td className="py-2.5 px-3">Prospecting & hydrogen-signature mapping only.</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          Requires heavy excavation, cryogenic heating, condensation, and purification.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CHAPTER 12: FURTHER READING & SCIENTIFIC REFERENCES */}
          {activeSection === 'ch12-resources' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-100">
                  NASA & Space Exploration Resources
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explore {EXTERNAL_REFERENCES.length} verified articles from NASA, ESA, the
                  National Academies, and introductory science references organized across all seven
                  mission topics. Links open in a new tab without disturbing your simulation.
                </p>
              </div>

              {/* Topic & Difficulty Filters */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded border border-slate-800 bg-slate-900/40">
                <div className="flex-1 min-w-[200px]">
                  <label
                    htmlFor="resource-topic-filter"
                    className="block text-[11px] font-mono text-slate-400 mb-1"
                  >
                    Filter by Topic
                  </label>
                  <select
                    id="resource-topic-filter"
                    value={resourceTopicFilter}
                    onChange={(e) => setResourceTopicFilter(e.target.value)}
                    className="w-full min-h-[40px] sm:min-h-0 px-2.5 py-1.5 text-xs rounded border border-slate-700 bg-[#070B14] text-slate-100"
                  >
                    <option value="All">All 7 Topics (A–G)</option>
                    {REFERENCE_TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-slate-400 mb-1">
                    Difficulty Level
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setResourceDifficultyFilter(diff)}
                        className={`min-h-[38px] sm:min-h-0 px-2.5 py-1 text-xs rounded border cursor-pointer ${
                          resourceDifficultyFilter === diff
                            ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300'
                            : 'border-slate-700 bg-[#070B14] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grouped References */}
              <div className="space-y-3 sm:space-y-6">
                {REFERENCE_TOPICS.map((topic, idx) => {
                  const groupItems = filteredReferences.filter((r) => r.topic === topic);
                  if (groupItems.length === 0) return null;
                  return (
                    <MobileAccordionBox
                      key={topic}
                      title={topic}
                      subtitle={`${groupItems.length} verified articles`}
                      defaultOpenMobile={idx === 0 || resourceTopicFilter !== 'All'}
                    >
                      <section className="space-y-3">
                        <h4 className="hidden md:block text-sm font-semibold text-cyan-300 border-b border-slate-800 pb-1.5">
                          {topic}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {groupItems.map((item) => (
                            <ReferenceCard key={item.id} item={item} />
                          ))}
                        </div>
                      </section>
                    </MobileAccordionBox>
                  );
                })}
              </div>
            </div>
          )}

          {/* Previous / Next Chapter Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {prevChapter ? (
              <button
                type="button"
                onClick={() => selectChapter(prevChapter.id)}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{prevChapter.shortLabel}</span>
              </button>
            ) : (
              <span />
            )}

            {nextChapter && (
              <button
                type="button"
                onClick={() => selectChapter(nextChapter.id)}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:bg-cyan-900/40 cursor-pointer ml-auto"
              >
                <span>Next: {nextChapter.shortLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
