// lib/core/router.dart
import 'package:flutter/material.dart';
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

const _protectedPaths = [
  '/account',
  '/purchases',
  '/certificates',
  '/wishlist',
  '/support',
];

bool _isProtected(String path) =>
    _protectedPaths.any((p) => path == p || path.startsWith('$p/'));

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter buildRouter(AuthState authState) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: authState,
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/sign-in' ||
          state.matchedLocation == '/sign-up';

      if (authState.status == AuthStatus.unknown) return null;

      final needsAuth = _isProtected(state.matchedLocation);
      final isAuthed = authState.status == AuthStatus.authenticated;

      if (needsAuth && !isAuthed) return '/sign-in';
      if (loggingIn && isAuthed) return '/';
      return null;
    },
    routes: [
      // Bottom-nav tabs — each keeps its own navigation stack.
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => _AppShell(shell: shell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellNavigatorKey,
            routes: [
              GoRoute(
                path: '/',
                builder: (c, s) => const HomeScreen(),
                routes: [
                  GoRoute(
                    path: 'courses/:courseId',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (c, s) => CourseDetailScreen(courseId: s.pathParameters['courseId']!),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/browse', builder: (c, s) => const BrowseScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/wishlist', builder: (c, s) => const WishlistScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/account', builder: (c, s) => const AccountScreen()),
            ],
          ),
        ],
      ),

      // Full-screen routes pushed on top of the shell (no bottom nav visible).
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/courses/:courseId/lessons/:lessonId',
        builder: (c, s) => LessonScreen(
          courseId: s.pathParameters['courseId']!,
          lessonId: s.pathParameters['lessonId']!,
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/instructors/:handle',
        builder: (c, s) => InstructorProfileScreen(handle: s.pathParameters['handle']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/products/:productId',
        builder: (c, s) => ProductDetailScreen(productId: s.pathParameters['productId']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/products/:productId/purchase',
        builder: (c, s) => PurchaseCheckoutScreen(productId: s.pathParameters['productId']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/purchases',
        builder: (c, s) => const PurchasesListScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/purchases/:purchaseId',
        builder: (c, s) => PurchaseDetailScreen(purchaseId: s.pathParameters['purchaseId']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/certificates',
        builder: (c, s) => const CertificatesListScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/certificates/:certificateId',
        builder: (c, s) => CertificateDetailScreen(certificateId: s.pathParameters['certificateId']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/support',
        builder: (c, s) => const SupportListScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/support/new',
        builder: (c, s) => const NewSupportTicketScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/support/:ticketId',
        builder: (c, s) => SupportTicketDetailScreen(ticketId: s.pathParameters['ticketId']!),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/sign-in',
        builder: (c, s) => const SignInScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/sign-up',
        builder: (c, s) => const SignUpScreen(),
      ),
    ],
  );
}

class _AppShell extends StatelessWidget {
  final StatefulNavigationShell shell;
  const _AppShell({required this.shell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Browse'),
          NavigationDestination(icon: Icon(Icons.favorite_outline), selectedIcon: Icon(Icons.favorite), label: 'Wishlist'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
        ],
      ),
    );
  }
}