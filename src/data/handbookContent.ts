export type HandbookSectionId =
  | 'ch1-briefing'
  | 'ch2-interface'
  | 'ch3-life-support'
  | 'ch4-power'
  | 'ch5-radiation'
  | 'ch6-agriculture'
  | 'ch7-rover'
  | 'ch8-interconnected'
  | 'ch9-emergencies'
  | 'ch10-glossary'
  | 'ch11-strategy'
  | 'ch12-resources';

export type ReferenceTopicKey =
  | 'A. Lunar Missions and Habitats'
  | 'B. Life Support and Atmosphere Control'
  | 'C. Power and Energy Management'
  | 'D. Radiation Protection'
  | 'E. Space Agriculture'
  | 'F. Lunar Rover and Resource Exploration'
  | 'G. Interconnected Systems and Mission Sustainability';

export interface ExternalReference {
  id: string;
  title: string;
  organization: 'NASA' | 'ESA' | 'National Academies' | 'Wikipedia';
  topic: ReferenceTopicKey;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  mechanicConnection: string;
  url: string;
  kind: 'Official Program / Educational' | 'Technical Reference / Report' | 'Introductory Overview';
}

export interface GlossaryTerm {
  id: string;
  term: string;
  symbol?: string;
  units?: string;
  category: 'Atmosphere' | 'Energy' | 'Radiation' | 'Agriculture' | 'Exploration' | 'Environment';
  definition: string;
  example: string;
  inGameRole: string;
}

export interface EmergencyProcedureRow {
  id: string;
  alert: string;
  severity: 'warning' | 'critical';
  meaning: string;
  whyDangerous: string;
  checkFirst: string;
  whereToGo: string;
  prioritizedActions: string;
  mistakesToAvoid: string;
}

export interface TutorialStep {
  step: number;
  title: string;
  summary: string;
  whatToLookFor: string;
  recommendedTargetScreen?: 'mission-control' | 'subsystems' | 'lunar-surface' | 'handbook';
}

export const HANDBOOK_CHAPTERS: Array<{
  id: HandbookSectionId;
  shortLabel: string;
  title: string;
  group: 'Orientation' | 'Subsystem Guides' | 'Operations & Science';
}> = [
  {
    id: 'ch1-briefing',
    shortLabel: 'Ch 1 · Mission Briefing',
    title: 'Chapter 1: Mission Briefing',
    group: 'Orientation',
  },
  {
    id: 'ch2-interface',
    shortLabel: 'Ch 2 · Interface Guide',
    title: 'Chapter 2: Understanding the Interface',
    group: 'Orientation',
  },
  {
    id: 'ch3-life-support',
    shortLabel: 'Ch 3 · Life Support & Air',
    title: 'Chapter 3: Life Support and Atmosphere Control',
    group: 'Subsystem Guides',
  },
  {
    id: 'ch4-power',
    shortLabel: 'Ch 4 · Power Grid & Energy',
    title: 'Chapter 4: Power Grid and Energy Management',
    group: 'Subsystem Guides',
  },
  {
    id: 'ch5-radiation',
    shortLabel: 'Ch 5 · Radiation & Shelter',
    title: 'Chapter 5: Radiation Protection and Habitat Safety',
    group: 'Subsystem Guides',
  },
  {
    id: 'ch6-agriculture',
    shortLabel: 'Ch 6 · Food & Greenhouse',
    title: 'Chapter 6: Food Production and Greenhouse',
    group: 'Subsystem Guides',
  },
  {
    id: 'ch7-rover',
    shortLabel: 'Ch 7 · Rover & Exploration',
    title: 'Chapter 7: Lunar Rover and Resource Exploration',
    group: 'Subsystem Guides',
  },
  {
    id: 'ch8-interconnected',
    shortLabel: 'Ch 8 · Interconnected Systems',
    title: 'Chapter 8: Resource Management and Interconnected Systems',
    group: 'Operations & Science',
  },
  {
    id: 'ch9-emergencies',
    shortLabel: 'Ch 9 · Emergency Procedures',
    title: 'Chapter 9: Emergency Procedures',
    group: 'Operations & Science',
  },
  {
    id: 'ch10-glossary',
    shortLabel: 'Ch 10 · Scientific Glossary',
    title: 'Chapter 10: Scientific Glossary',
    group: 'Operations & Science',
  },
  {
    id: 'ch11-strategy',
    shortLabel: 'Ch 11 · Tips & Strategies',
    title: 'Chapter 11: Tips, Strategies and Common Mistakes',
    group: 'Operations & Science',
  },
  {
    id: 'ch12-resources',
    shortLabel: 'Ch 12 · NASA & Space Resources',
    title: 'Chapter 12: Further Reading & Scientific References',
    group: 'Operations & Science',
  },
];

export const EXTERNAL_REFERENCES: ExternalReference[] = [
  // A. Lunar Missions and Habitats
  {
    id: 'ref-nasa-artemis',
    title: 'NASA Artemis Program Overview',
    organization: 'NASA',
    topic: 'A. Lunar Missions and Habitats',
    difficulty: 'Beginner',
    summary:
      'Explains how NASA plans to return astronauts to the Moon, establish long-term surface operations near the lunar South Pole, and build toward Mars missions.',
    mechanicConnection:
      'Provides the real-world backdrop for your 4-astronaut, 30-day Shackleton Crater Rim expedition.',
    url: 'https://www.nasa.gov/humans-in-space/artemis/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-moonbase',
    title: 'NASA Moonbase Systems',
    organization: 'NASA',
    topic: 'A. Lunar Missions and Habitats',
    difficulty: 'Beginner',
    summary:
      'Covers the core habitat systems astronauts need to live and work on the Moon, including pressurized modules, life support, power, and dust protection.',
    mechanicConnection:
      'Directly mirrors the five interconnected modules you manage on the Space Command console.',
    url: 'https://www.nasa.gov/moonbase-systems/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-artemis-camp',
    title: 'Artemis Base Camp (Introductory Overview)',
    organization: 'Wikipedia',
    topic: 'A. Lunar Missions and Habitats',
    difficulty: 'Beginner',
    summary:
      'An accessible summary of proposed lunar south pole base concepts, habitation modules, mobility assets, and surface mission timelines.',
    mechanicConnection:
      'Helps students connect the Outpost Base, Rover, and 30-day endurance scenario to real mission concepts.',
    url: 'https://en.wikipedia.org/wiki/Artemis_Base_Camp',
    kind: 'Introductory Overview',
  },

  // B. Life Support and Atmosphere Control
  {
    id: 'ref-nasa-eclss',
    title: 'Environmental Control and Life Support Systems (ECLSS)',
    organization: 'NASA',
    topic: 'B. Life Support and Atmosphere Control',
    difficulty: 'Intermediate',
    summary:
      'Explains how NASA spacecraft recycle wastewater, split water into oxygen via electrolysis, and scrub exhaled carbon dioxide from cabin air.',
    mechanicConnection:
      'Explains the real flight hardware behind your O₂ Electrolysis Generator, CO₂ Amine Scrubber, and Water Distillation Recycler.',
    url: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/',
    kind: 'Technical Reference / Report',
  },
  {
    id: 'ref-esa-melissa',
    title: 'ESA MELiSSA: Closed-Loop Life Support Project',
    organization: 'ESA',
    topic: 'B. Life Support and Atmosphere Control',
    difficulty: 'Intermediate',
    summary:
      'Details the European Space Agency research program developing regenerative ecosystems to recycle waste, CO₂, and water for long-duration missions.',
    mechanicConnection:
      'Connects directly to why high water recovery efficiency (90–94%) is vital for surviving 30 days on finite tanks.',
    url: 'https://www.esa.int/articles/melissa-life-support-project-an-innovation-network-in-support-to-space-exploration',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-electrolysis',
    title: 'Electrolysis of Water',
    organization: 'Wikipedia',
    topic: 'B. Life Support and Atmosphere Control',
    difficulty: 'Beginner',
    summary:
      'Introduces the chemistry and energy balance of splitting H₂O into hydrogen and oxygen gas using an electric current.',
    mechanicConnection:
      'Shows the science behind the in-game reaction 2H₂O → 2H₂ + O₂ (1.125 L water + 5.8 kWh per kg O₂).',
    url: 'https://en.wikipedia.org/wiki/Electrolysis_of_water',
    kind: 'Introductory Overview',
  },
  {
    id: 'ref-wiki-iss-eclss',
    title: 'ISS Environmental Control and Life Support System',
    organization: 'Wikipedia',
    topic: 'B. Life Support and Atmosphere Control',
    difficulty: 'Beginner',
    summary:
      'Walks through the Oxygen Generation System, Sabatier reactor, and Water Recovery System used aboard the International Space Station.',
    mechanicConnection:
      'Explains why CO₂ scrubbers and water distillers require continuous electrical power and routine maintenance.',
    url: 'https://en.wikipedia.org/wiki/ISS_ECLSS',
    kind: 'Introductory Overview',
  },

  // C. Power and Energy Management
  {
    id: 'ref-nasa-lunar-tech',
    title: 'NASA Lunar Surface Technology',
    organization: 'NASA',
    topic: 'C. Power and Energy Management',
    difficulty: 'Intermediate',
    summary:
      'Explores surface power generation, energy storage, thermal extremes, and electrostatic lunar dust mitigation technologies.',
    mechanicConnection:
      'Explains why lunar regolith dust steadily lowers your solar generation efficiency until you run Clean Solar Arrays.',
    url: 'https://www.nasa.gov/lunar-surface-technology/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-moon-science',
    title: "NASA Science: Earth's Moon",
    organization: 'NASA',
    topic: 'C. Power and Energy Management',
    difficulty: 'Beginner',
    summary:
      'Covers the Moon’s rotation, 29.5-day synodic day/night cycle, polar illumination geometry, and extreme surface temperatures.',
    mechanicConnection:
      'Illustrates why Shackleton Rim (~82% illumination) needs far smaller batteries than Mare Tranquillitatis (14-day lunar night).',
    url: 'https://science.nasa.gov/moon/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-south-pole',
    title: 'Lunar South Pole & Peaks of Eternal Light',
    organization: 'Wikipedia',
    topic: 'C. Power and Energy Management',
    difficulty: 'Beginner',
    summary:
      'Describes how the Moon’s tiny 1.5° axial tilt creates sunlit crater rims right beside permanently shadowed cold traps.',
    mechanicConnection:
      'Directly explains the three configurable landing-site illumination curves in New Mission Setup.',
    url: 'https://en.wikipedia.org/wiki/Lunar_south_pole',
    kind: 'Introductory Overview',
  },

  // D. Radiation Protection
  {
    id: 'ref-nasa-radiation',
    title: 'NASA Human Health & Performance: Space Radiation',
    organization: 'NASA',
    topic: 'D. Radiation Protection',
    difficulty: 'Intermediate',
    summary:
      'Explains how astronauts are exposed to Galactic Cosmic Rays and Solar Particle Events beyond Earth’s magnetic shield, and how dose is monitored.',
    mechanicConnection:
      'Grounds your Cumulative Crew Dose (mSv) gauge and Storm Shelter safety alerts.',
    url: 'https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-srag',
    title: 'NASA Space Radiation Analysis Group (SRAG): What Is Space Radiation?',
    organization: 'NASA',
    topic: 'D. Radiation Protection',
    difficulty: 'Intermediate',
    summary:
      'Clear breakdown of ionizing radiation types (GCRs vs. SPEs), biological risks, and why solar storms require rapid crew sheltering.',
    mechanicConnection:
      'Explains why Solar Particle Events give a short warning window before proton flux spikes.',
    url: 'https://srag.jsc.nasa.gov/spaceradiation/what/what.cfm',
    kind: 'Technical Reference / Report',
  },
  {
    id: 'ref-esa-radiation',
    title: 'ESA: The Radiation Challenge',
    organization: 'ESA',
    topic: 'D. Radiation Protection',
    difficulty: 'Beginner',
    summary:
      'Beginner-friendly guide to deep-space radiation hazards and how spacecraft designers use hydrogen-rich materials and local regolith for shielding.',
    mechanicConnection:
      'Connects directly to why Water Wall Bladders block protons better per kg than Aluminium.',
    url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/The_radiation_challenge',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-na-radiation',
    title: 'National Academies: Space Radiation Hazards on the Lunar Surface',
    organization: 'National Academies',
    topic: 'D. Radiation Protection',
    difficulty: 'Advanced',
    summary:
      'Peer-reviewed scientific report analyzing lunar surface GCR/SPE exposure, secondary neutron scatter, and storm-shelter requirements.',
    mechanicConnection:
      'Highlights the difference between real particle-transport physics and our simplified educational exponential model.',
    url: 'https://www.nationalacademies.org/read/11760/chapter/5',
    kind: 'Technical Reference / Report',
  },

  // E. Space Agriculture
  {
    id: 'ref-nasa-plants',
    title: 'NASA: Growing Plants in Space',
    organization: 'NASA',
    topic: 'E. Space Agriculture',
    difficulty: 'Beginner',
    summary:
      'Shows how NASA studies space crops for fresh nutrition, crew morale, water transpiration, and future bioregenerative habitats.',
    mechanicConnection:
      'Connects directly to your 3 hydroponic bays, crew morale bonuses, and why fresh harvests supplement packaged rations.',
    url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-veggie',
    title: 'NASA Veggie Plant Growth System',
    organization: 'NASA',
    topic: 'E. Space Agriculture',
    difficulty: 'Beginner',
    summary:
      'Details the orbital vegetable chamber that grew Outredgeous red romaine lettuce and radishes using tuned LED lighting and root-zone nutrient pillows.',
    mechanicConnection:
      'Featured directly in your Bay 01–03 crop catalog (Outredgeous Lettuce and Cherry Belle Radish).',
    url: 'https://science.nasa.gov/mission/veggie/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-hydroponics',
    title: 'Hydroponics',
    organization: 'Wikipedia',
    topic: 'E. Space Agriculture',
    difficulty: 'Beginner',
    summary:
      'Explains soil-less plant cultivation using mineral nutrient solutions, root oxygenation, and controlled lighting.',
    mechanicConnection:
      'Explains why Nutrient Dosing modes, LED intensity, and Root-Zone Oxygenation Calibration govern crop health.',
    url: 'https://en.wikipedia.org/wiki/Hydroponics',
    kind: 'Introductory Overview',
  },

  // F. Lunar Rover and Resource Exploration
  {
    id: 'ref-nasa-ltv',
    title: 'NASA Lunar Terrain Vehicle (LTV)',
    organization: 'NASA',
    topic: 'F. Lunar Rover and Resource Exploration',
    difficulty: 'Beginner',
    summary:
      'Covers NASA’s next-generation crewed and tele-operated lunar rover built to navigate rugged south polar slopes and shadowed crater rims.',
    mechanicConnection:
      'Inspires your rover route planning, Safe Crater Detour vs Direct Traverse trade-offs, and wheel mobility maintenance.',
    url: 'https://www.nasa.gov/moonbase/lunar-terrain-vehicle/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-viper',
    title: 'NASA VIPER Polar Water-Ice Prospecting Rover',
    organization: 'NASA',
    topic: 'F. Lunar Rover and Resource Exploration',
    difficulty: 'Intermediate',
    summary:
      'Describes how robotic rovers use neutron spectrometers and drills to map subsurface water-ice deposits near permanently shadowed craters.',
    mechanicConnection:
      'Explains why your rover confirms water-ice signatures and core samples without turning them into instant drinking water.',
    url: 'https://www.nasa.gov/mission/viper/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-nasa-isru',
    title: 'NASA Overview: In-Situ Resource Utilization (ISRU)',
    organization: 'NASA',
    topic: 'F. Lunar Rover and Resource Exploration',
    difficulty: 'Intermediate',
    summary:
      'Explains how future missions will excavate, heat, condense, and purify lunar ice and regolith into water, oxygen, and construction materials.',
    mechanicConnection:
      'Clarifies why prospecting comes first and why actual extraction requires dedicated mining and thermal processing plants.',
    url: 'https://www.nasa.gov/overview-in-situ-resource-utilization/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-lunar-water',
    title: 'Lunar Water & Permanently Shadowed Craters',
    organization: 'Wikipedia',
    topic: 'F. Lunar Rover and Resource Exploration',
    difficulty: 'Beginner',
    summary:
      'Summarizes how ancient comet and solar-wind water molecules remain trapped as cryogenic ice in dark polar craters.',
    mechanicConnection:
      'Gives scientific context for PSR Frost Prospect Alpha and De Gerlache Ice Trench on your 2D Lunar Surface map.',
    url: 'https://en.wikipedia.org/wiki/Lunar_water',
    kind: 'Introductory Overview',
  },

  // G. Interconnected Systems and Mission Sustainability
  {
    id: 'ref-nasa-sustainability',
    title: 'NASA Outlines Lunar Surface Sustainability Concept',
    organization: 'NASA',
    topic: 'G. Interconnected Systems and Mission Sustainability',
    difficulty: 'Intermediate',
    summary:
      'Presents NASA’s integrated systems vision uniting fixed surface habitats, power grids, rovers, and ISRU for long-duration presence.',
    mechanicConnection:
      'Ties all five Space Command modules together into a single cohesive mission-control architecture.',
    url: 'https://www.nasa.gov/general/nasa-outlines-lunar-surface-sustainability-concept/',
    kind: 'Official Program / Educational',
  },
  {
    id: 'ref-wiki-melissa',
    title: 'MELiSSA Regenerative Ecosystem',
    organization: 'Wikipedia',
    topic: 'G. Interconnected Systems and Mission Sustainability',
    difficulty: 'Intermediate',
    summary:
      'Explains how air, water, waste, and plant loops connect in closed ecological life support architectures.',
    mechanicConnection:
      'Reinforces Chapter 8’s lesson: managing one module independently always breaks another.',
    url: 'https://en.wikipedia.org/wiki/MELiSSA',
    kind: 'Introductory Overview',
  },
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'o2',
    term: 'Oxygen',
    symbol: 'O₂',
    units: 'kg · kPa',
    category: 'Atmosphere',
    definition:
      'A breathable gas essential for human metabolism. Inside Earth-like spacecraft cabins, oxygen partial pressure is kept near 21.2 kPa.',
    example: 'Four nominal astronauts consume 4 × 0.84 = 3.36 kg of O₂ per Earth day.',
    inGameRole:
      'Tracked in kg reserves and cabin kPa in 01. Life Support. Replenished via Electrolysis or Emergency O₂ backup.',
  },
  {
    id: 'co2',
    term: 'Carbon Dioxide',
    symbol: 'CO₂',
    units: 'ppm (parts per million)',
    category: 'Atmosphere',
    definition:
      'Waste gas exhaled by astronauts during respiration. In sealed habitats, rising CO₂ rapidly impairs thinking and becomes toxic.',
    example: 'Earth air is ~420 ppm; spacecraft cabins target < 2,000 ppm. Above 5,000 ppm is unhealthy.',
    inGameRole:
      'Continuously removed by the CO₂ Amine Scrubber (1.0 kW). Warnings fire at 5,000 ppm; critical failure occurs around 20,000–30,000 ppm.',
  },
  {
    id: 'electrolysis',
    term: 'Electrolysis',
    symbol: '2H₂O → 2H₂ + O₂',
    units: 'L H₂O & kWh per kg O₂',
    category: 'Atmosphere',
    definition:
      'Using an electric current to split liquid water molecules into breathable oxygen gas (O₂) and hydrogen gas (H₂).',
    example: 'Producing 1 kg of O₂ consumes 1.125 L of water and 5.8 kWh of electricity.',
    inGameRole:
      'Controlled by the O₂ Electrolysis Generator (Off / Conserve / Balanced / Boost) in 01. Life Support.',
  },
  {
    id: 'hydroponics',
    term: 'Hydroponics',
    units: 'L/h · kW',
    category: 'Agriculture',
    definition:
      'Growing crops without soil by circulating nutrient-rich water across plant roots under controlled artificial LED light.',
    example: 'Outredgeous Lettuce matures in 7 days (168 h), yielding 2.6 kg dry-equivalent food.',
    inGameRole:
      'Operates Bays 01–03 in 04. Food & Water. Requires irrigation water, LED electricity, and root-zone oxygenation.',
  },
  {
    id: 'photosynthesis',
    term: 'Photosynthesis',
    symbol: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂',
    category: 'Agriculture',
    definition:
      'The biological process by which plants use light energy to turn carbon dioxide and water into sugars (food biomass) and oxygen.',
    example: 'Dimming LED grow lights from 100% to 50% cuts photosynthesis speed in half.',
    inGameRole:
      'Drives crop growth speed in Bays 01–03. Note: in this simplified model, 3 small bays supplement food & humidity while mechanical ECLSS regulates cabin air.',
  },
  {
    id: 'gcr',
    term: 'Galactic Cosmic Rays',
    symbol: 'GCR',
    units: 'mSv/h',
    category: 'Radiation',
    definition:
      'High-energy protons and heavy atomic nuclei traveling from outside our solar system, creating a constant background radiation field on the Moon.',
    example: 'Unshielded lunar background GCR in this simulation is 0.015 mSv/h (~0.36 mSv/day).',
    inGameRole:
      'Always present at low levels; reduced continuously by your Aluminium hull, Water Wall, and Lunar Regolith berm.',
  },
  {
    id: 'spe',
    term: 'Solar Particle Events',
    symbol: 'SPE',
    units: 'mSv/h',
    category: 'Radiation',
    definition:
      'Intense, sudden bursts of high-energy protons launched by solar flares or coronal mass ejections.',
    example: 'During an active SPE in the game, unshielded dose rate surges to ~0.58 mSv/h (>35× background).',
    inGameRole:
      'Gives a 5-hour advance warning and pauses multi-hour jumps so you can move the crew into the Radiation Storm Shelter.',
  },
  {
    id: 'radiation-dose',
    term: 'Radiation Dose',
    symbol: 'mSv',
    units: 'millisieverts (mSv)',
    category: 'Radiation',
    definition:
      'A measure of biological radiation energy absorbed by human tissue over time.',
    example: 'Caution threshold is 50 mSv; emergency mission failure limit in the game is 250 mSv.',
    inGameRole:
      'Accumulates hourly based on unshielded flux multiplied by your shielding transmission factor.',
  },
  {
    id: 'regolith',
    term: 'Regolith',
    units: 'kg',
    category: 'Environment',
    definition:
      'The loose layer of crushed rock, mineral fragments, and sharp electrostatic dust covering the lunar surface.',
    example: '450 kg regolith sandbags piled onto the habitat roof block radiation without using Earth cargo mass.',
    inGameRole:
      'Settles as dust on solar arrays (lowering power), and can be stacked as an in-situ radiation berm in 03. Radiation Safety.',
  },
  {
    id: 'isru',
    term: 'ISRU (In-Situ Resource Utilization)',
    category: 'Exploration',
    definition:
      'Finding, mining, and processing local space materials (such as lunar water-ice or regolith) rather than shipping everything from Earth.',
    example: 'Confirming ice at PSR Frost Prospect Alpha maps a future mining site, but does not fill water tanks immediately.',
    inGameRole:
      'Rover missions survey ISRU prospects; extraction requires separate mining/thermal plants beyond this 30-day outpost scope.',
  },
  {
    id: 'battery-capacity',
    term: 'Battery Capacity',
    units: 'kWh',
    category: 'Energy',
    definition:
      'Total electrical energy a battery bank can store when fully charged. Degrades gradually under thermal imbalance or deep cycling.',
    example: 'Default outpost battery holds 120 kWh (capable of running a 5 kW base load for ~22 hours with 92% efficiency).',
    inGameRole:
      'Stores surplus solar power during sunlight and sustains the base during 36–60h polar shadows.',
  },
  {
    id: 'power-kw',
    term: 'Power',
    symbol: 'P',
    units: 'kilowatts (kW)',
    category: 'Energy',
    definition:
      'The instantaneous rate at which electrical energy is generated or consumed right now—analogous to water flow speed in a pipe.',
    example: 'CO₂ scrubber (1.0 kW) + Water recycler (1.1 kW) + Habitat base (2.4 kW) = 4.5 kW continuous power.',
    inGameRole:
      'Displayed for Solar Generation (kW) and Subsystem Demand (kW) in 02. Surface Power.',
  },
  {
    id: 'energy-kwh',
    term: 'Energy',
    symbol: 'E = P × t',
    units: 'kilowatt-hours (kWh)',
    category: 'Energy',
    definition:
      'Total work performed or stored over time: Power (kW) multiplied by Time (hours).',
    example: 'Charging the rover dock at 2.5 kW for 4 hours transfers ~10 kWh of energy.',
    inGameRole:
      'Used for Outpost Battery reserves (kWh) and Rover traverse energy planning (kWh).',
  },
  {
    id: 'life-support',
    term: 'Life Support (ECLSS)',
    category: 'Atmosphere',
    definition:
      'Environmental Control and Life Support Systems that keep a sealed habitat habitable by managing O₂, CO₂, pressure, and clean water.',
    example: 'Without ECLSS power, cabin CO₂ climbs ~1,000+ ppm per hour with 4 active astronauts.',
    inGameRole:
      'Controlled in Module 01 and protected as Priority 1 (P1) under Crew Survival First.',
  },
  {
    id: 'water-recycling',
    term: 'Water Recycling (WRS)',
    units: '% recovery',
    category: 'Atmosphere',
    definition:
      'Purification and distillation hardware that captures wastewater, sweat, and cabin humidity for reuse.',
    example: 'At 90% recovery, 11.2 L/day gross crew water use loses only 1.12 L/day net.',
    inGameRole:
      'Managed in 01. Life Support; also captures 55% of greenhouse crop transpiration water.',
  },
  {
    id: 'lunar-south-pole',
    term: 'Lunar South Pole',
    units: '~89° S latitude',
    category: 'Environment',
    definition:
      'Polar highland region where low-angle sunlight illuminates elevated crater rims for ~68–82% of the month while deep crater floors remain in permanent shadow.',
    example: 'Shackleton Crater Rim sees brief 36-hour eclipses instead of the 14-day equatorial lunar night.',
    inGameRole:
      'Determines your site’s solar illumination curve and places water-ice craters within rover range.',
  },
  {
    id: 'solar-array',
    term: 'Solar Array',
    units: 'kW peak',
    category: 'Energy',
    definition:
      'Photovoltaic panel wings that convert sunlight directly into DC electricity. Output drops with low sun angles, shadows, or dust.',
    example: 'An 18 kW peak array at 80% sunlight with 20% dust loss outputs 18 × 0.8 × 0.8 = 11.52 kW.',
    inGameRole:
      'Primary power source in 02. Surface Power; restored with Clean Solar Arrays.',
  },
  {
    id: 'habitat-shielding',
    term: 'Habitat Shielding',
    units: 'kg · g/cm²',
    category: 'Radiation',
    definition:
      'Physical mass placed around living quarters to absorb or scatter ionizing space radiation before it reaches astronauts.',
    example: 'Combining Aluminium hull, Water Wall bladders, and Lunar Regolith reduces incoming radiation dose rate.',
    inGameRole:
      'Configured in 03. Radiation Safety alongside the inner Storm Shelter.',
  },
];

export const EMERGENCY_PROCEDURES: EmergencyProcedureRow[] = [
  {
    id: 'em-low-o2',
    alert: '1. Low Oxygen Supply (< 10 kg or Emergency O₂ Engaged)',
    severity: 'critical',
    meaning: 'Primary oxygen tanks are nearly empty and cabin pressure risks dropping.',
    whyDangerous: 'Hypoxia causes rapid incapacitation and fatal mission failure if O₂ reaches 0.',
    checkFirst: 'Check O₂ Electrolysis mode, Life Support power status, and Water reserves (> 10 L).',
    whereToGo: '01. Life Support & 02. Surface Power',
    prioritizedActions:
      '1) Set O₂ Electrolysis Generator to Boost or Balanced. 2) Set Power Priority to Crew Survival First (P1 Life Support). 3) Set Crew Activity to Resting (-15% O₂ burn). 4) Keep Emergency O₂ Auto-Feed Armed.',
    mistakesToAvoid: 'Leaving Electrolysis Off or running Rover Fast-Charge ahead of Life Support.',
  },
  {
    id: 'em-high-co2',
    alert: '2. Excessive CO₂ Levels (> 5,000 ppm)',
    severity: 'critical',
    meaning: 'Exhaled carbon dioxide is building up faster than the scrubber removes it.',
    whyDangerous: 'Above 10,000–20,000 ppm, CO₂ causes severe hypercapnia and crew health collapse.',
    checkFirst: 'Verify CO₂ Amine Scrubber is Enabled, Powered, and check Scrubber Health %.',
    whereToGo: '01. Life Support',
    prioritizedActions:
      '1) Enable CO₂ Amine Scrubber if disabled. 2) Click Service to restore scrubber health to 100%. 3) Switch Crew Activity to Resting temporarily.',
    mistakesToAvoid: 'Ignoring amine-bed wear alerts or keeping Crew Activity on High during scrubber faults.',
  },
  {
    id: 'em-crit-battery',
    alert: '3. Critical Battery Level (< 18% SoC or Load Shedding)',
    severity: 'critical',
    meaning: 'Total electrical demand exceeds solar generation and battery reserves are nearly exhausted.',
    whyDangerous: 'If battery hits 0 kWh during darkness, Habitat Thermal & Life Support lose power.',
    checkFirst: 'Compare Solar Generation (kW) vs Total Demand (kW) and inspect Dust Loss %.',
    whereToGo: '02. Surface Power & 04. Food & Water',
    prioritizedActions:
      '1) Select Crew Survival First load priority. 2) Click Clean Solar Arrays if dusty. 3) Lower Greenhouse LED Lighting to 50% or 0%. 4) Pause Rover Dock Charging.',
    mistakesToAvoid: 'Running 100% grow lights and Boost electrolysis through a 36h crater shadow.',
  },
  {
    id: 'em-solar-failure',
    alert: '4. Solar Power Generation Drop (Tracking Fault / Dust / Eclipse)',
    severity: 'warning',
    meaning: 'Solar array output has fallen sharply due to dust accumulation, actuator fault, or polar shadow.',
    whyDangerous: 'Forces continuous battery drain and triggers automatic load shedding of lower-priority modules.',
    checkFirst: 'Inspect the 72-Hour Illumination Forecast chart and Solar Dust Loss %.',
    whereToGo: '02. Surface Power',
    prioritizedActions:
      '1) Click Clean Solar Arrays immediately. 2) Click Rebalance Battery Cells if battery health dropped. 3) Trim optional loads before shadow deepens.',
    mistakesToAvoid: 'Waiting until battery drops below 15% before reducing greenhouse or rover loads.',
  },
  {
    id: 'em-radiation',
    alert: '5. Radiation Alert (Solar Particle Event Warning / Active SPE)',
    severity: 'critical',
    meaning: 'High-energy solar proton storm inbound or currently striking the lunar surface.',
    whyDangerous: 'Unshielded dose rate surges >35× background, pushing crew toward the 250 mSv failure limit.',
    checkFirst: 'Confirm Storm Shelter Status (ACTIVE vs OPEN) and cumulative dose (mSv).',
    whereToGo: '03. Radiation Safety',
    prioritizedActions:
      '1) Click Enter Storm Shelter immediately (-82% dose rate). 2) Keep crew sheltered until the SPE Cleared notice appears. 3) Add Water Wall or Regolith shielding when safe.',
    mistakesToAvoid: 'Leaving crew outside the storm shelter during peak flux to keep building regolith.',
  },
  {
    id: 'em-greenhouse',
    alert: '6. Greenhouse Malfunction (Root Stress / Crop Failure)',
    severity: 'warning',
    meaning: 'Crop health is dropping from oxygenation stress, prolonged darkness, or water shortage.',
    whyDangerous: 'Losing a 14-day potato harvest can leave packaged food insufficient before Day 30.',
    checkFirst: 'Check Greenhouse System Health %, LED Lighting %, and Water Reserves (L).',
    whereToGo: '04. Food & Water',
    prioritizedActions:
      '1) Click Calibrate to restore greenhouse health to 100%. 2) Click Clear Tray on failed bays. 3) Replant fast Outredgeous Lettuce (7d) and preserve packaged food.',
    mistakesToAvoid: 'Leaving a failed crop tray un-cleared or setting LEDs to 0% for multiple days.',
  },
  {
    id: 'em-water',
    alert: '7. Water Shortage (< 35 L Remaining)',
    severity: 'critical',
    meaning: 'Potable water tanks are running dangerously low.',
    whyDangerous: 'Water is required for crew hydration, O₂ electrolysis, and crops; 0 L causes rapid crew failure.',
    checkFirst: 'Check Water Recycler status/health %, Greenhouse Nutrient mode, and Water Wall allocation.',
    whereToGo: '01. Life Support, 03. Radiation Safety & 04. Food & Water',
    prioritizedActions:
      '1) Enable & Service Water Distillation Recycler. 2) Switch Nutrient Dosing to Eco (-18% crop water). 3) Click Drain -30 L to Tank in Radiation Safety if water is stored in wall bladders.',
    mistakesToAvoid: 'Pumping water into Radiation Walls while tanks are below 70 L or running Boost electrolysis unnecessarily.',
  },
  {
    id: 'em-rover-batt',
    alert: '8. Rover Battery Warning (< 10 kWh or Insufficient Return Margin)',
    severity: 'warning',
    meaning: 'Rover battery is critically low while operating away from the Outpost Base.',
    whyDangerous: 'At 0 kWh away from base, the rover becomes Stranded and cannot return samples or survey more sites.',
    checkFirst: 'Check distance from Outpost Base and remaining Rover Battery (kWh).',
    whereToGo: 'Lunar Surface (05. Rover Ops)',
    prioritizedActions:
      '1) Stop drilling samples immediately. 2) Click Return to Base (or Abort Sortie & Return to Base). 3) Ensure Dock Charging: On once docked.',
    mistakesToAvoid: 'Collecting extra samples (-1.8 kWh each) when battery only barely covers return travel.',
  },
  {
    id: 'em-comms',
    alert: '9. Weak Telemetry / Communication Range Limit (> 12 km)',
    severity: 'warning',
    meaning: 'Rover is operating near or beyond the nominal 12 km direct line-of-sight radio horizon.',
    whyDangerous: 'Weak radio relay increases operational risk during rough crater exploration.',
    checkFirst: 'Check Comms distance readout on the Rover KPI bar and the dashed 12 km ring on the map.',
    whereToGo: 'Lunar Surface (05. Rover Ops)',
    prioritizedActions:
      '1) Survey sites inside the 12 km comms radius first (e.g., Malapert Relay Knoll). 2) Return to Base promptly after completing sample collection.',
    mistakesToAvoid: 'Pushing past reliable comms range with degraded wheels or low battery.',
  },
  {
    id: 'em-equipment',
    alert: '10. Equipment Degradation (Scrubber / Recycler / Battery / Rover Wheels)',
    severity: 'warning',
    meaning: 'Mechanical wear, dust fouling, or thermal imbalance has reduced subsystem efficiency.',
    whyDangerous: 'Degraded components waste energy, lose water, or allow CO₂ to creep upward over time.',
    checkFirst: 'Inspect Active Alerts and subsystem health percentages across Modules 01, 02, 04, and 05.',
    whereToGo: 'Affected Subsystem Module',
    prioritizedActions:
      '1) Click Service on CO₂ Scrubber / Water Recycler. 2) Click Clean Solar Arrays / Rebalance Battery Cells. 3) Click Calibrate in Greenhouse or Service Wheels on docked Rover.',
    mistakesToAvoid: 'Ignoring gradual wear alerts until multiple subsystems degrade simultaneously.',
  },
];

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 1,
    title: 'Welcome, Mission Commander',
    summary:
      'You command a 4-astronaut lunar research outpost at the Lunar South Pole for 30 Earth days. Your primary mission is keeping the crew alive while managing finite oxygen, water, electricity, food, and radiation shielding.',
    whatToLookFor:
      'Check the top Telemetry Ribbon anytime for Mission Day/Hour, Overall Status, Crew Health, and Time Controls (+1h, +6h, +1d).',
    recommendedTargetScreen: 'mission-control',
  },
  {
    step: 2,
    title: 'How Time & Auto-Pause Work',
    summary:
      'Time advances in fixed 1-hour steps. Use Resume/Pause for continuous pacing, or advance +1h, +6h, or +1d (24h). Multi-hour jumps automatically pause if a Solar Particle Event warning or critical alert occurs.',
    whatToLookFor:
      'Watch Active Alerts on Mission Control—every alert explains what happened and links straight to the affected module.',
    recommendedTargetScreen: 'mission-control',
  },
  {
    step: 3,
    title: 'Five Interconnected Subsystems',
    summary:
      'No module works alone: O₂ Electrolysis consumes water and electricity; Greenhouse crops consume water and LED power; Water Wall shielding uses potable water; and Rover dock charging draws from the outpost grid.',
    whatToLookFor:
      'Open Subsystems to control Life Support, Surface Power, Radiation Safety, Food & Water, and Rover Ops.',
    recommendedTargetScreen: 'subsystems',
  },
  {
    step: 4,
    title: 'Prepare Early for Food & Radiation',
    summary:
      'Initial packaged rations (60 kg) cover ~24 days for 4 astronauts, so plant Bay 03 early in Food & Water. Also stack free Lunar Regolith shielding in Radiation Safety before the first solar storm.',
    whatToLookFor:
      'Hover or tap any small info icon beside controls to read quick scientific explanations or jump to the full chapter.',
    recommendedTargetScreen: 'subsystems',
  },
  {
    step: 5,
    title: 'Explore & Consult Your Handbook Anytime',
    summary:
      'Use Lunar Surface to plan Safe Crater Detours around hazards and map water-ice prospects. You can open Mission Handbook from the navigation bar anytime—your mission timer and progress stay completely safe.',
    whatToLookFor:
      'Bookmark important chapters or review Chapter 9 Emergency Procedures whenever an alert appears.',
    recommendedTargetScreen: 'lunar-surface',
  },
];
