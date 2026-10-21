import {
  lastJakartaDates,
  startOfJakartaDay,
  startOfNextJakartaDay,
  toJakartaDateKey,
  toJakartaIsoDate,
} from './jakarta-date.js';

describe('jakarta-date', () => {
  it('memakai tanggal Jakarta, bukan UTC (21 Okt 23:30 UTC = 22 Okt WIB)', () => {
    const instant = new Date('2026-10-21T23:30:00Z');
    expect(toJakartaIsoDate(instant)).toBe('2026-10-22');
    expect(toJakartaDateKey(instant)).toBe('20261022');
  });

  it('batas hari Jakarta = 17:00 UTC hari sebelumnya', () => {
    expect(startOfJakartaDay('2026-10-21').toISOString()).toBe('2026-10-20T17:00:00.000Z');
    expect(startOfNextJakartaDay('2026-10-21').toISOString()).toBe('2026-10-21T17:00:00.000Z');
  });

  it('lastJakartaDates mengembalikan N hari berurutan diakhiri hari ini', () => {
    const dates = lastJakartaDates(3, new Date('2026-10-21T05:00:00Z'));
    expect(dates).toEqual(['2026-10-19', '2026-10-20', '2026-10-21']);
  });
});
