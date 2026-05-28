export function calculateBidIncrement(
  participants: number
) {
  // Muy poca competencia
  if (participants <= 1) {
    return 500000;
  }

  // Competencia moderada
  if (participants <= 5) {
    return 100000;
  }

  // Mucha competencia
  if (participants <= 10) {
    return 50000;
  }

  // Guerra total
  return 25000;
}