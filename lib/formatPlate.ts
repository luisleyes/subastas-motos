/**
 * Ofusca la placa mostrando solo los primeros 3 caracteres
 * Ejemplo: "ABC123" → "ABC***"
 * Ejemplo: "XYZ789" → "XYZ***"
 */
export function formatPlate(plate: string, showFull: boolean = false): string {
  if (showFull) return plate;
  
  if (!plate) return "***";
  
  // Si la placa tiene más de 3 caracteres
  if (plate.length > 3) {
    const firstThree = plate.slice(0, 3);
    const hidden = "*".repeat(plate.length - 3);
    return `${firstThree}${hidden}`;
  }
  
  // Si la placa es muy corta
  return "*".repeat(plate.length);
}

/**
 * Verifica si el usuario tiene acceso para ver la placa completa
 */
export function canViewPlate(hasAccess: boolean): boolean {
  return hasAccess;
}