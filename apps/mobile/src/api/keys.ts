import type { SearchParams } from './types';

/**
 * TanStack Query keys, in one place so a mutation can invalidate exactly
 * what it changed. Everything user-specific sits under `me`, so signing out
 * clears it all with one `removeQueries({ queryKey: keys.me.all })`.
 */
export const keys = {
  config: ['config'] as const,
  categories: ['categories'] as const,
  products: (limit?: number) => ['products', { limit }] as const,
  search: (params: SearchParams) => ['search', params] as const,
  product: (productId: string) => ['product', productId] as const,
  productReviews: (productId: string, page: number) => ['product', productId, 'reviews', page] as const,
  course: (courseId: string) => ['course', courseId] as const,
  courseReviews: (courseId: string) => ['course', courseId, 'reviews'] as const,
  instructor: (handle: string) => ['instructor', handle] as const,
  verifyCertificate: (code: string) => ['verify', code] as const,

  me: {
    all: ['me'] as const,
    profile: ['me', 'profile'] as const,
    signInMethods: ['me', 'sign-in-methods'] as const,
    productState: (productId: string) => ['me', 'product', productId] as const,
    courses: ['me', 'courses'] as const,
    course: (courseId: string) => ['me', 'courses', courseId] as const,
    lesson: (lessonId: string) => ['me', 'lesson', lessonId] as const,
    lessonQuestions: (lessonId: string) => ['me', 'lesson', lessonId, 'questions'] as const,
    wishlist: ['me', 'wishlist'] as const,
    certificates: ['me', 'certificates'] as const,
    certificate: (certificateId: string) => ['me', 'certificates', certificateId] as const,
    supportTickets: ['me', 'support'] as const,
    supportTicket: (ticketId: string) => ['me', 'support', ticketId] as const,
  },
};
