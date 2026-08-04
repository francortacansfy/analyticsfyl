const assert = require('assert');
const {
    addMonths, resolveBuyerPeriod, segmentBuyers,
    computeDeltaPct, computeDeltaPP, getMaxFecha, formatFechaDMY
} = require('./buyer-metrics.js');

// addMonths
assert.strictEqual(addMonths('2026-07', 1), '2026-08');
assert.strictEqual(addMonths('2026-12', 1), '2027-01');
assert.strictEqual(addMonths('2026-07', -1), '2026-06');
assert.strictEqual(addMonths('2026-01', -1), '2025-12');
assert.strictEqual(addMonths('2026-07', -12), '2025-07');

// resolveBuyerPeriod: año + mes -> ese mes vs mes anterior
let p = resolveBuyerPeriod('2026', '07', ['2025-01', '2026-06', '2026-07']);
assert.deepStrictEqual(p.months, ['2026-07']);
assert.deepStrictEqual(p.prevMonths, ['2026-06']);

// resolveBuyerPeriod: solo año -> 12 meses del año vs 12 meses del año anterior
p = resolveBuyerPeriod('2026', '', ['2025-01', '2026-01', '2026-07']);
assert.strictEqual(p.months.length, 12);
assert.strictEqual(p.months[0], '2026-01');
assert.strictEqual(p.months[11], '2026-12');
assert.strictEqual(p.prevMonths[0], '2025-01');
assert.strictEqual(p.prevMonths[11], '2025-12');

// resolveBuyerPeriod: sin filtro -> último mes disponible vs el anterior
p = resolveBuyerPeriod('', '', ['2025-01', '2026-06', '2026-07']);
assert.deepStrictEqual(p.months, ['2026-07']);
assert.deepStrictEqual(p.prevMonths, ['2026-06']);

// resolveBuyerPeriod: sin datos disponibles
assert.deepStrictEqual(resolveBuyerPeriod('', '', []), { months: [], prevMonths: [] });

// segmentBuyers: definición de Mercado Libre —
// A compró en 2025-08 y en 2026-07 -> frecuente (2025-08 cae en la ventana [2025-07, 2026-07)).
// B compró por primera vez en 2026-07, sin historial -> nuevo.
// C compró en 2024-01 y en 2026-07, pero NO entre 2025-07 y 2026-06 -> nuevo
// (no compró en los 12 meses previos al período, aunque sí compró alguna vez antes).
const orders = [
    { dni: 'A', yearmonth: '2025-08' },
    { dni: 'A', yearmonth: '2026-07' },
    { dni: 'B', yearmonth: '2026-07' },
    { dni: 'C', yearmonth: '2024-01' },
    { dni: 'C', yearmonth: '2026-07' },
];
const seg = segmentBuyers(orders, ['2026-07']);
assert.strictEqual(seg.total, 3);
assert.strictEqual(seg.frecuentes, 1);
assert.strictEqual(seg.nuevos, 2);
assert.strictEqual(Math.round(seg.tasaRecompra), 33);

assert.deepStrictEqual(segmentBuyers(orders, []), { total: 0, frecuentes: 0, nuevos: 0, tasaRecompra: 0 });

// computeDeltaPct / computeDeltaPP
assert.strictEqual(computeDeltaPct(80, 100), -20);
assert.strictEqual(computeDeltaPct(10, 0), null);
assert.ok(Math.abs(computeDeltaPP(45, 47.2) - (-2.2)) < 1e-9);

// getMaxFecha / formatFechaDMY
assert.strictEqual(getMaxFecha([{ fecha: '2026-07-01' }, { fecha: '2026-07-15' }, { fecha: '2026-06-30' }]), '2026-07-15');
assert.strictEqual(getMaxFecha([]), '');
assert.strictEqual(formatFechaDMY('2026-07-15'), '15/07/2026');
assert.strictEqual(formatFechaDMY(''), '—');

console.log('OK: buyer-metrics.test.js — todos los asserts pasaron');
