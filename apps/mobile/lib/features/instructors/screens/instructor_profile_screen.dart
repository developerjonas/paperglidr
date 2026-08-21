// lib/features/instructors/screens/instructor_profile_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/instructor.dart';
import '../data/instructors_api.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/instructors/[handle]/page.tsx
/// Public.
class InstructorProfileScreen extends StatefulWidget {
  final String handle;
  const InstructorProfileScreen({super.key, required this.handle});

  @override
  State<InstructorProfileScreen> createState() => _InstructorProfileScreenState();
}

class _InstructorProfileScreenState extends State<InstructorProfileScreen> {
  late Future<Instructor> _future;

  @override
  void initState() {
    super.initState();
    _future = InstructorsApi.fetchByHandle(widget.handle);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('@${widget.handle}')),
      body: FutureBuilder<Instructor>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.error_outline,
              message: 'Could not load instructor.\n${snapshot.error}',
            );
          }
          final instructor = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundImage: instructor.avatarUrl != null
                        ? NetworkImage(instructor.avatarUrl!)
                        : null,
                    child: instructor.avatarUrl == null
                        ? Text(instructor.name.isNotEmpty ? instructor.name[0] : '?')
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(instructor.name, style: Theme.of(context).textTheme.titleLarge),
                        Text('@${instructor.handle}', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
              if (instructor.bio != null) ...[
                const SizedBox(height: 16),
                Text(instructor.bio!, style: Theme.of(context).textTheme.bodyMedium),
              ],
              const SizedBox(height: 24),
              Text('Courses', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (instructor.courses.isEmpty)
                const EmptyState(message: 'No published courses yet.')
              else
                ...instructor.courses.map(
                  (c) => Card(
                    clipBehavior: Clip.antiAlias,
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      leading: c.imageUrl.isEmpty
                          ? null
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                c.imageUrl,
                                width: 56,
                                height: 56,
                                fit: BoxFit.cover,
                              ),
                            ),
                      title: Text(c.name),
                      onTap: () => context.push('/courses/${c.id}'),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}