export function extendAuctionIfNeeded(
  endTime: Date
) {
  const now = new Date();

  const remainingTime =
    endTime.getTime() - now.getTime();

  // 2 minutos
  const extensionWindow =
    2 * 60 * 1000;

  // Si quedan menos de 2 minutos
  if (remainingTime <= extensionWindow) {

    // Extender 2 minutos más
    return new Date(
      endTime.getTime() + extensionWindow
    );
  }

  return endTime;
}