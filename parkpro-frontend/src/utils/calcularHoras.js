/**
 * Calculate hours between two timestamps
 * @returns {{ diffMs, diffHours, horasACobrar, minutosExtra }}
 */
export function calcularHoras(horaIngreso, horaSalida = new Date()) {
  const inicio = new Date(horaIngreso);
  const fin = new Date(horaSalida);
  const diffMs = fin - inicio;
  const diffHoras = diffMs / (1000 * 60 * 60);
  const horasACobrar = Math.ceil(diffHoras); // Round up to full hour
  const minutosExtra = Math.round((diffHoras - Math.floor(diffHoras)) * 60);

  return {
    diffMs,
    diffHoras: parseFloat(diffHoras.toFixed(2)),
    horasACobrar,
    minutosExtra,
  };
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(ms) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
