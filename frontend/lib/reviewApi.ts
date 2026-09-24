import { request } from "./http";

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  quote: string;
  authorName: string;
  authorInitials?: string | null;
  authorMeta?: string | null;
}

export type ReviewItemType = "EXCURSION" | "RENTAL" | "EVENT";

export interface SubmitReviewInput {
  itemType: ReviewItemType;
  itemId: string;
  itemTitle: string;
  rating: number;
  title?: string;
  quote: string;
  authorName: string;
  authorMeta?: string;
  guestEmail?: string;
}

export const reviewApi = {
  listReviews: (scope?: { itemType: ReviewItemType; itemId: string }) =>
    request<Review[]>(scope ? `/reviews?itemType=${scope.itemType}&itemId=${scope.itemId}` : "/reviews"),
  submitReview: (data: SubmitReviewInput) =>
    request<{ id: string; status: string }>("/reviews", { method: "POST", body: JSON.stringify(data) }),
};
