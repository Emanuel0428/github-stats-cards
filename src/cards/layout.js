// La tarjeta de lenguajes tiene que medir siempre lo mismo que la de stats:
// en un README van una al lado de la otra y cualquier diferencia de alto se ve.
// Por eso el alto manda sobre el número de filas: las filas se reparten en el
// hueco disponible y las que no caben legibles no se dibujan (4 de los 5 temas
// ya recortaban a 6-7 lenguajes por diseño).

export const STATS_HEIGHT = { plain: 280, streaks: 340 };

const MIN_STEP = 18;   // por debajo de esto el texto de 12-14px se pisa
const MAX_STEP = 35;   // separación original, no tiene sentido superarla
const BOTTOM_PAD = 25;

export function langLayout(wanted, yOffset, includeStreaks) {
  const height = includeStreaks ? STATS_HEIGHT.streaks : STATS_HEIGHT.plain;
  const room = height - yOffset - BOTTOM_PAD;
  const rows = Math.max(1, Math.min(wanted, Math.floor(room / MIN_STEP)));
  const step = Math.max(MIN_STEP, Math.min(MAX_STEP, room / rows));
  return { height, step, rows };
}
