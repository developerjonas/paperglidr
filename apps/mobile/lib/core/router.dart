import 'package:go_router/go_router.dart';
import 'auth/auth_state.dart';
import 'auth/screens/sign_in_screen.dart';
import 'auth/screens/sign_up_screen.dart';
import '../features/courses/screens/home_screen.dart';
import '../features/courses/screens/browse_screen.dart';
import '../features/courses/screens/course_detail_screen.dart';
import '../features/lessons/screens/lesson_screen.dart';
import '../features/instructors/screens/instructor_profile_screen.dart';
import '../features/products/screens/product_detail_screen.dart';
import '../features/purchases/screens/purchase_checkout_screen.dart';
import '../features/purchases/screens/purchases_list_screen.dart';
import '../features/purchases/screens/purchase_detail_screen.dart';
import '../features/certificates/screens/certificates_list_screen.dart';
import '../features/certificates/screens/certificate_detail_screen.dart';
import '../features/wishlist/screens/wishlist_screen.dart';
import '../features/support/screens/support_list_screen.dart';
import '../features/support/screens/new_support_ticket_screen.dart';
import '../features/support/screens/support_ticket_detail_screen.dart';
import '../features/account/screens/account_screen.dart';

/// Routes that require a signed-in user. Everything not listed here is
/// public, matching the "browse before you sign in" requirement.
const _protectedPaths = [
  '/account',
  '/purchases',
  '/certificates',
  '/wishlist',
  '/support',
];

bool _isProtected(String path) =>
    _protectedPaths.any((p) => path == p || path.startsWith('$p/'));

GoRouter buildRouter(AuthState authState) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: authState,
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/sign-in' ||
          state.matchedLocation == '/sign-up';

      // Auth status not resolved yet (still reading secure storage) — hold.
      if (authState.status == AuthStatus.unknown) return null;

      final needsAuth = _isProtected(state.matchedLocation);
      final isAuthed = authState.status == AuthStatus.authenticated;

      if (needsAuth && !isAuthed) return '/sign-in';
      if (loggingIn && isAuthed) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (c, s) => const HomeScreen()),
      GoRoute(path: '/browse', builder: (c, s) => const BrowseScreen()),
      GoRoute(
        path: '/courses/:courseId',
        builder: (c, s) => CourseDetailScreen(courseId: s.pathParameters['courseId']!),
      ),
      GoRoute(
        path: '/courses/:courseId/lessons/:lessonId',
        builder: (c, s) => LessonScreen(
          courseId: s.pathParameters['courseId']!,
          lessonId: s.pathParameters['lessonId']!,
        ),
      ),
      GoRoute(
        path: '/instructors/:handle',
        builder: (c, s) => InstructorProfileScreen(handle: s.pathParameters['handle']!),
      ),
      GoRoute(
        path: '/products/:productId',
        builder: (c, s) => ProductDetailScreen(productId: s.pathParameters['productId']!),
      ),
      GoRoute(
        path: '/products/:productId/purchase',
        builder: (c, s) => PurchaseCheckoutScreen(productId: s.pathParameters['productId']!),
      ),
      GoRoute(path: '/purchases', builder: (c, s) => const PurchasesListScreen()),
      GoRoute(
        path: '/purchases/:purchaseId',
        builder: (c, s) => PurchaseDetailScreen(purchaseId: s.pathParameters['purchaseId']!),
      ),
      GoRoute(path: '/certificates', builder: (c, s) => const CertificatesListScreen()),
      GoRoute(
        path: '/certificates/:certificateId',
        builder: (c, s) => CertificateDetailScreen(certificateId: s.pathParameters['certificateId']!),
      ),
      GoRoute(path: '/wishlist', builder: (c, s) => const WishlistScreen()),
      GoRoute(path: '/support', builder: (c, s) => const SupportListScreen()),
      GoRoute(path: '/support/new', builder: (c, s) => const NewSupportTicketScreen()),
      GoRoute(
        path: '/support/:ticketId',
        builder: (c, s) => SupportTicketDetailScreen(ticketId: s.pathParameters['ticketId']!),
      ),
      GoRoute(path: '/account', builder: (c, s) => const AccountScreen()),
      GoRoute(path: '/sign-in', builder: (c, s) => const SignInScreen()),
      GoRoute(path: '/sign-up', builder: (c, s) => const SignUpScreen()),
    ],
  );
}
