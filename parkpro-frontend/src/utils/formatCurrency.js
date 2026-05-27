/**
 * Format number as Colombian currency
 * e.g. 3000 → "$3.000"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * Format date/time for display
 */
export function formatDateTime(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(date));
}

export function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date));
}

/**
 * Devuelve la fecha LOCAL en formato YYYY-MM-DD.
 * IMPORTANTE: NO usar `new Date().toISOString().split('T')[0]` porque ese
 * convierte a UTC y de noche en Colombia (UTC-5) da el dia siguiente.
 */
export function fechaLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
