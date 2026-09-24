import { request } from "./http";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string | null;
  imageUrl?: string | null;
  readMinutes?: number | null;
  publishedAt?: string | null;
}

export const blogApi = {
  listPosts: () => request<BlogPost[]>("/blog-posts"),
  getPost: (slug: string) => request<BlogPost>(`/blog-posts/${slug}`),
};
