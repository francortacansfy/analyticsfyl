// Funciones puras compartidas por analyticsfyl/index.html:
// resolución de período, segmentación de compradores (Detalle de compradores),
// cálculo de deltas y fecha de última actualización.
// Se cargan como <script> clásico (definen globals) y también son requireable
// desde Node para tests — de ahí el guard de module.exports al final.

function addMonths(ym, n) {
    let [y, m] = ym.split('-').map(Number);
    m += n;
    while (m > 12) { m -= 12; y++; }
    while (m < 1)  { m += 12; y--; }
    return `${y}-${String(m).padStart(2, '0')}`;
}

function resolveBuyerPeriod(year, month, availableMonths) {
    if (!availableMonths.length) return { months: [], prevMonths: [] };
    if (year && month) {
        const ym = `${year}-${month}`;
        return { months: [ym], prevMonths: [addMonths(ym, -1)] };
    }
    if (year && !month) {
        const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        const prevMonths = months.map(m => addMonths(m, -12));
        return { months, prevMonths };
    }
    const last = availableMonths[availableMonths.length - 1];
    return { months: [last], prevMonths: [addMonths(last, -1)] };
}

function segmentBuyers(orders, periodMonths) {
    const empty = { total: 0, frecuentes: 0, nuevos: 0, tasaRecompra: 0 };
    if (!periodMonths.length) return empty;
    const periodSet = new Set(periodMonths);
    const buyersInPeriod = new Set(orders.filter(o => periodSet.has(o.yearmonth)).map(o => o.dni));
    if (!buyersInPeriod.size) return empty;

    const periodStart = [...periodMonths].sort()[0];
    const windowStart = addMonths(periodStart, -12);
    const priorBuyers = new Set(
        orders.filter(o => o.yearmonth >= windowStart && o.yearmonth < periodStart).map(o => o.dni)
    );

    let frecuentes = 0;
    buyersInPeriod.forEach(dni => { if (priorBuyers.has(dni)) frecuentes++; });
    const total = buyersInPeriod.size;
    return { total, frecuentes, nuevos: total - frecuentes, tasaRecompra: frecuentes / total * 100 };
}

function computeDeltaPct(curr, prev) {
    if (!prev) return null;
    return (curr - prev) / prev * 100;
}

function computeDeltaPP(curr, prev) {
    return curr - prev;
}

function getMaxFecha(rows) {
    return rows.reduce((max, r) => (r.fecha && r.fecha > max) ? r.fecha : max, '');
}

function formatFechaDMY(ymd) {
    if (!ymd) return '—';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
}

if (typeof module !== 'undefined') {
    module.exports = {
        addMonths, resolveBuyerPeriod, segmentBuyers,
        computeDeltaPct, computeDeltaPP, getMaxFecha, formatFechaDMY
    };
}
