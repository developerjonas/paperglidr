import { apiFetch, query } from './client';
import type {
  AppConfig,
  AssetDelivery,
  CourseReviews,
  Category,
  Certificate,
  CertificateVerification,
  InstructorProfile,
  LearnerCourse,
  Lesson,
  LessonCompletion,
  LessonQuestion,
  Me,
  MessageResult,
  MyCourse,
  ProductDetail,
  ProductListing,
  ProductReviews,
  ProductViewerState,
  PublicCourse,
  ReportReason,
  ReviewInput,
  SearchParams,
  SearchResults,
  SupportTicket,
  SupportTicketDetail,
  TicketCategory,
  WishlistItem,
} from './types';

/**
 * Typed calls to the web app's /api/v1 (docs/MOBILE_API.md). Checkout and
 * purchases are deliberately absent: the app doesn't take payments.
 */
const v1 = (path: string) => `/api/v1${path}`;
const id = (value: string) => encodeURIComponent(value);

export const api = {
  config: () => apiFetch<AppConfig>(v1('/config')),

  // Catalogue (public)
  categories: () => apiFetch<Category[]>(v1('/categories')),
  products: (limit?: number) => apiFetch<ProductListing[]>(v1(`/products${query({ limit })}`)),
  search: (params: SearchParams) => apiFetch<SearchResults>(v1(`/search${query(params)}`)),
  product: (productId: string) => apiFetch<ProductDetail>(v1(`/products/${id(productId)}`)),
  productReviews: (productId: string, page = 1) =>
    apiFetch<ProductReviews>(v1(`/products/${id(productId)}/reviews${query({ page })}`)),
  course: (courseId: string) => apiFetch<PublicCourse>(v1(`/courses/${id(courseId)}`)),
  courseReviews: (courseId: string) => apiFetch<CourseReviews>(v1(`/courses/${id(courseId)}/reviews`)),
  instructor: (handle: string) => apiFetch<InstructorProfile>(v1(`/instructors/${id(handle)}`)),
  verifyCertificate: (code: string) =>
    apiFetch<CertificateVerification>(v1(`/certificates/verify/${id(code)}`)),

  // Signed in
  me: () => apiFetch<Me>(v1('/me')),
  productViewerState: (productId: string) =>
    apiFetch<ProductViewerState>(v1(`/products/${id(productId)}/me`)),
  myCourses: () => apiFetch<MyCourse[]>(v1('/me/courses')),
  myCourse: (courseId: string) => apiFetch<LearnerCourse>(v1(`/me/courses/${id(courseId)}`)),

  lesson: (lessonId: string) => apiFetch<Lesson>(v1(`/lessons/${id(lessonId)}`)),
  /** `assetPath` is a lesson asset's `url` (already a /api/v1 path). */
  lessonAsset: (assetPath: string) => apiFetch<AssetDelivery>(assetPath),
  setLessonComplete: (lessonId: string, complete: boolean) =>
    apiFetch<LessonCompletion>(v1(`/lessons/${id(lessonId)}/complete`), {
      method: complete ? 'POST' : 'DELETE',
    }),
  lessonQuestions: (lessonId: string) =>
    apiFetch<LessonQuestion[]>(v1(`/lessons/${id(lessonId)}/questions`)),
  askQuestion: (lessonId: string, body: string) =>
    apiFetch<MessageResult>(v1(`/lessons/${id(lessonId)}/questions`), { method: 'POST', body: { body } }),
  replyToQuestion: (questionId: string, body: string) =>
    apiFetch<MessageResult>(v1(`/questions/${id(questionId)}/replies`), { method: 'POST', body: { body } }),

  createReview: (courseId: string, review: ReviewInput) =>
    apiFetch<MessageResult>(v1(`/courses/${id(courseId)}/review`), { method: 'POST', body: review }),
  updateReview: (courseId: string, review: ReviewInput) =>
    apiFetch<MessageResult>(v1(`/courses/${id(courseId)}/review`), { method: 'PUT', body: review }),
  deleteReview: (courseId: string) =>
    apiFetch<MessageResult>(v1(`/courses/${id(courseId)}/review`), { method: 'DELETE' }),

  wishlist: () => apiFetch<WishlistItem[]>(v1('/wishlist')),
  addToWishlist: (productId: string) =>
    apiFetch<{ ok: true; wishlisted: true }>(v1('/wishlist'), { method: 'POST', body: { productId } }),
  removeFromWishlist: (productId: string) =>
    apiFetch<{ ok: true; wishlisted: false }>(v1(`/wishlist/${id(productId)}`), { method: 'DELETE' }),

  certificates: () => apiFetch<Certificate[]>(v1('/certificates')),
  certificate: (certificateId: string) => apiFetch<Certificate>(v1(`/certificates/${id(certificateId)}`)),

  supportTickets: () => apiFetch<SupportTicket[]>(v1('/support')),
  supportTicket: (ticketId: string) => apiFetch<SupportTicketDetail>(v1(`/support/${id(ticketId)}`)),
  createSupportTicket: (ticket: { subject: string; message: string; category?: TicketCategory }) =>
    apiFetch<SupportTicketDetail>(v1('/support'), { method: 'POST', body: ticket }),
  replyToSupportTicket: (ticketId: string, content: string) =>
    apiFetch<SupportTicketDetail>(v1(`/support/${id(ticketId)}/messages`), { method: 'POST', body: { content } }),

  report: (report: { targetType: 'product' | 'lesson'; targetId: string; reason: ReportReason; details?: string }) =>
    apiFetch<MessageResult>(v1('/reports'), { method: 'POST', body: report }),
};
