import { calculateBidIncrement } from "@/lib/bidIncrement";

export type MotorcycleRow = {
  id: string;
  status: string;
  base_price: number;
  buy_now_price?: number | null;
  auction_end?: string | null;
  user_id?: string | null;
  current_price?: number | null;
};

export function getHighestBidAmount(
  bids: { amount: number }[],
  basePrice: number
): number {
  if (bids.length === 0) return basePrice;
  return Math.max(...bids.map((b) => b.amount));
}

export function getMinimumAllowedBid(
  basePrice: number,
  bids: { amount: number; user_id?: string | null }[]
): number {
  const participants = new Set(
    bids.map((b) => b.user_id).filter(Boolean)
  ).size;
  const increment = calculateBidIncrement(participants);

  if (bids.length === 0) {
    return basePrice;
  }

  const highest = Math.max(...bids.map((b) => b.amount));
  return highest + increment;
}

export function isAuctionExpired(auctionEnd?: string | null): boolean {
  if (!auctionEnd) return false;
  return new Date(auctionEnd).getTime() <= Date.now();
}

export function isAuctionActive(moto: MotorcycleRow): boolean {
  return moto.status === "active" && !isAuctionExpired(moto.auction_end);
}

export function canUseBuyNow(
  moto: MotorcycleRow,
  currentHighestBid: number
): boolean {
  if (!moto.buy_now_price || moto.status !== "active") return false;
  if (isAuctionExpired(moto.auction_end)) return false;
  return currentHighestBid < moto.buy_now_price;
}
