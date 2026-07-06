const ZONA_PERU = 'America/Lima';

export function formatearFechaHoraPeru(fecha: string | Date): string {
  return new Date(fecha).toLocaleString('es-PE', { timeZone: ZONA_PERU });
}

export function formatearHoraPeru(fecha: string | Date): string {
  return new Date(fecha).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA_PERU,
  });
}

// Formato YYYY-MM-DD según el día calendario en Perú (no UTC), para filtros de fecha.
export function fechaPeruISO(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString('en-CA', { timeZone: ZONA_PERU });
}
