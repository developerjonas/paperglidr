// lib/features/courses/screens/home_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data/my_course.dart';
import '../data/my_courses_api.dart';
import '../widgets/my_course_card.dart';
import '../../../core/auth/auth_state.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/page.tsx — the landing/home tab.
/// Shows the courses the signed-in user actually has access to, NOT the
/// public product catalog (that's Browse). Signed-out users get a
/// sign-in/browse prompt instead of a course list.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<List<MyCourse>>? _future;
  AuthStatus? _lastFetchedFor;

  Future<void> _refresh() async {
    final next = MyCoursesApi.fetchMyCourses();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final isSignedIn = auth.status == AuthStatus.authenticated;

    // Fetch once we know the user is signed in — covers both cold start
    // (already authenticated) and signing in mid-session (status flips
    // from unauthenticated -> authenticated while this screen is alive).
    if (isSignedIn && _lastFetchedFor != auth.status) {
      _lastFetchedFor = auth.status;
      _future = MyCoursesApi.fetchMyCourses();
    }
    if (!isSignedIn) {
      _lastFetchedFor = auth.status;
      _future = null;
    }

    return Scaffold(
      appBar: AppBar(title: const Text('paperglidr'), centerTitle: false),
      body: RefreshIndicator(
        onRefresh: isSignedIn ? _refresh : () async {},
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              isSignedIn
                  ? 'Welcome back${auth.user?.name.isNotEmpty == true ? ', ${auth.user!.name}' : ''}'
                  : 'Welcome to paperglidr',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 4),
            Text(
              isSignedIn ? 'Pick up where you left off.' : 'Sign in to see your courses.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 20),

            if (!isSignedIn) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('New here?', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 4),
                      const Text('Create an account to track your progress and earn certificates.'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          FilledButton(
                            onPressed: () => context.push('/sign-up'),
                            child: const Text('Create account'),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () => context.go('/browse'),
                            child: const Text('Browse courses'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Text('My Courses', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              FutureBuilder<List<MyCourse>>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: LoadingIndicator(),
                    );
                  }
                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: EmptyState(
                        icon: Icons.error_outline,
                        message: 'Could not load your courses.\n${snapshot.error}',
                      ),
                    );
                  }
                  final courses = snapshot.data ?? [];
                  if (courses.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Column(
                        children: [
                          const EmptyState(
                            icon: Icons.school_outlined,
                            message: "You haven't enrolled in anything yet.",
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () => context.go('/browse'),
                            child: const Text('Browse courses'),
                          ),
                        ],
                      ),
                    );
                  }
                  return Column(
                    children: courses.map((c) => MyCourseCard(course: c)).toList(),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}