/**
 * Response shapes of the web app's /api/v1 routes
 * (apps/web/src/app/api/v1). Dates arrive as ISO strings.
 * Keep in step with those routes and docs/MOBILE_API.md.
 */

export type ISODate = string;

export type Gateway = 'esewa' | 'khalti' | 'fonepay';

export type AppConfig = {
  siteName: string;
  siteUrl: string;
  supportEmail: string;
  gateways: Gateway[];
  policy: {
    refundWindowDays: number;
    refundWindowHours: number;
    refundCompletionThresholdPercent: number;
    minimumPayout: string;
    payoutHoldDays: number;
    payoutRequiresVerifiedPhone: boolean;
    platformFeePercent: { referralLink: number; platform: number };
    creatorSharePercent: { referralLink: number; platform: number };
    referralWindowDays: number;
    minDescriptionLength: number;
  };
  /** The policies; the text lives on the website (open siteUrl + path). */
  legal: { lastUpdated: string; pages: { path: string; title: string; summary: string }[] };
  company: {
    brandName: string;
    legalName: string;
    registeredAddress: string;
    registration: string;
    pan: string;
    supportEmail: string;
    legalEmail: string;
  };
};

export type Category = { id: string; name: string; slug: string };

// ---- Catalogue ----

export type ProductListing = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInRupees: number;
  avgRating: number | null;
  reviewCount: number;
};

export type SearchSort = 'relevance' | 'rating' | 'newest' | 'price_asc' | 'price_desc';

export type SearchParams = {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SearchSort;
  page?: number;
};

export type SearchResults = {
  page: number;
  results: (ProductListing & { categoryId: string | null })[];
};

export type InstructorSummary = {
  handle: string;
  name: string;
  profileImageUrl: string;
  isVerified: boolean;
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInRupees: number;
  categoryId: string | null;
  /** The instructor's name, or the author's for products without an instructor profile. */
  authorName: string;
  instructor: InstructorSummary | null;
  courses: { courseId: string; courseName: string }[];
  averageRating: number | null;
  reviewCount: number;
};

export type ProductReview = {
  id: string;
  courseId: string;
  rating: number;
  content: string | null;
  instructorReply: string | null;
  instructorReplyAt: ISODate | null;
  createdAt: ISODate;
  reviewerName: string;
  reviewerImage: string | null;
};

export type ProductReviews = {
  averageRating: number | null;
  reviewCount: number;
  page: number;
  pageSize: number;
  reviews: ProductReview[];
};

export type ProductViewerState = {
  owned: boolean;
  wishlisted: boolean;
  latestPurchase: { id: string; status: string; createdAt: ISODate } | null;
};

export type LessonStatus = 'public' | 'private' | 'preview';

export type PublicCourse = {
  id: string;
  name: string;
  description: string;
  sections: {
    id: string;
    name: string;
    order: number;
    lessons: { id: string; sectionId: string; name: string; order: number; status: LessonStatus }[];
  }[];
};

export type InstructorProfile = InstructorSummary & {
  bio: string;
  /** Their public products (what you can buy), A–Z. */
  products: { id: string; name: string; description: string; imageUrl: string; priceInRupees: number }[];
  /** The website's "Courses": their courses in at least one public product, A–Z. */
  courses: { id: string; name: string; description: string }[];
};

export type CertificateVerification = {
  certificateCode: string;
  userNameSnapshot: string;
  courseTitleSnapshot: string;
  instructorNameSnapshot: string;
  issuedAt: ISODate;
  isRevoked: boolean;
};

// ---- Me and learning ----

export type Me = {
  id: string;
  name: string;
  username: string | null;
  displayUsername: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: 'user' | 'admin';
  createdAt: ISODate;
  instructor: InstructorSummary | null;
};

export type MyCourse = {
  id: string;
  name: string;
  description: string;
  /** Published sections and lessons only, as the website counts them. */
  totalSections: number;
  totalLessons: number;
  completedLessons: number;
};

export type MyReview = {
  id: string;
  rating: number;
  content: string | null;
  instructorReply: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
};

export type LearnerCourse = Omit<MyCourse, 'totalSections'> & {
  /** Reviews need 50% of the course completed (the website's rule). */
  review: { canWrite: boolean; completionPercent: number; requiredPercent: number };
  sections: {
    id: string;
    name: string;
    lessons: { id: string; name: string; isPreview: boolean; isComplete: boolean }[];
  }[];
  myReview: MyReview | null;
};

export type LessonAsset = {
  id: string;
  type: 'youtube' | 'video_file' | 'pdf' | 'image' | 'audio';
  provider: 'youtube' | 'r2' | 'bunny';
  role: 'primary' | 'attachment';
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  downloadable: boolean;
  durationSeconds: number | null;
  order: number;
  /** Path of GET /api/v1/lessons/:id/assets/:assetId. */
  url: string;
};

export type Lesson = {
  id: string;
  name: string;
  description: string | null;
  isPreview: boolean;
  sectionId: string;
  courseId: string;
  isComplete: boolean;
  assets: LessonAsset[];
};

export type AssetDelivery =
  | { type: 'inline' | 'download' | 'bunny_embed'; url: string }
  | { type: 'youtube'; externalId: string };

export type IssuedCertificateRef = { id: string; certificateCode: string; issuedAt: ISODate };

export type LessonCompletion = {
  message?: string;
  isComplete: boolean;
  certificate: IssuedCertificateRef | null;
};

export type QuestionAuthor = { name: string; image: string | null; isMine: boolean; isInstructor: boolean };

export type LessonQuestion = {
  id: string;
  body: string;
  createdAt: ISODate;
  author: QuestionAuthor;
  replies: { id: string; body: string; createdAt: ISODate; author: QuestionAuthor }[];
};

export type ReviewInput = { rating: number; content?: string };

export type CourseReview = {
  id: string;
  rating: number;
  content: string | null;
  instructorReply: string | null;
  createdAt: ISODate;
  edited: boolean;
  reviewerName: string;
  reviewerImage: string | null;
  isMine: boolean;
};

export type CourseReviews = {
  averageRating: number | null;
  reviewCount: number;
  reviews: CourseReview[];
};

// ---- Wishlist, certificates, support, reports ----

export type WishlistItem = {
  wishlistItemId: string;
  productId: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInRupees: number;
  /** False once the product is unpublished — still saved, can't be opened. */
  available: boolean;
  addedAt: ISODate;
};

export type Certificate = {
  id: string;
  certificateCode: string;
  courseId: string;
  userNameSnapshot?: string;
  courseTitleSnapshot: string;
  instructorNameSnapshot: string;
  courseDurationMinutesSnapshot: number | null;
  issuedAt: ISODate;
  revokedAt: ISODate | null;
  revokedReason: string | null;
  verifyUrl: string;
};

export type TicketCategory = 'account' | 'billing' | 'technical' | 'instructor' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicket = {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  lastMessageAt: ISODate;
  createdAt: ISODate;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  isAdminReply: boolean;
  content: string;
  createdAt: ISODate;
};

export type SupportTicketDetail = SupportTicket & { messages: SupportMessage[] };

export type ReportReason = 'scam' | 'piracy' | 'misleading' | 'inappropriate' | 'other';

export type MessageResult = { message?: string };
