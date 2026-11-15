import { describe, expect, it } from 'vitest';
import {
  EMERGENCY_PROCEDURES,
  EXTERNAL_REFERENCES,
  GLOSSARY_TERMS,
  HANDBOOK_CHAPTERS,
  TUTORIAL_STEPS,
} from './handbookContent';

describe('Mission Handbook Content Integrity', () => {
  it('contains all 12 required handbook chapters', () => {
    const ids = HANDBOOK_CHAPTERS.map((c) => c.id);
    expect(HANDBOOK_CHAPTERS.length).toBe(12);
    expect(ids).toEqual([
      'ch1-briefing',
      'ch2-interface',
      'ch3-life-support',
      'ch4-power',
      'ch5-radiation',
      'ch6-agriculture',
      'ch7-rover',
      'ch8-interconnected',
      'ch9-emergencies',
      'ch10-glossary',
      'ch11-strategy',
      'ch12-resources',
    ]);
  });

  it('includes all 18 required scientific glossary terms', () => {
    const termsText = GLOSSARY_TERMS.map(
      (t) => `${t.term} ${t.symbol ?? ''} ${t.id}`
    )
      .join(' ')
      .toLowerCase();
    const required = [
      'o₂',
      'co₂',
      'electrolysis',
      'hydroponics',
      'photosynthesis',
      'galactic cosmic rays',
      'solar particle events',
      'radiation dose',
      'regolith',
      'isru',
      'battery capacity',
      'power',
      'energy',
      'life support',
      'water recycling',
      'lunar south pole',
      'solar array',
      'habitat shielding',
    ];
    for (const needle of required) {
      expect(termsText).toContain(needle);
    }
    expect(GLOSSARY_TERMS.length).toBe(18);
  });

  it('includes all 10 emergency procedures and 5 beginner tutorial steps', () => {
    expect(EMERGENCY_PROCEDURES.length).toBe(10);
    expect(TUTORIAL_STEPS.length).toBe(5);
  });

  it('provides verified HTTPS external learning references across all 7 topics A-G', () => {
    const topics = new Set(EXTERNAL_REFERENCES.map((r) => r.topic));
    expect(topics.size).toBe(7);
    expect(EXTERNAL_REFERENCES.length).toBeGreaterThanOrEqual(20);
    for (const ref of EXTERNAL_REFERENCES) {
      expect(ref.url.startsWith('https://')).toBe(true);
      expect(ref.summary.length).toBeGreaterThan(20);
      expect(ref.mechanicConnection.length).toBeGreaterThan(15);
    }
  });
});
