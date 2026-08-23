// lib/features/lessons/screens/lesson_screen.dart
import 'package:flutter/material.dart';
import '../data/lesson.dart';
import '../data/lesson_asset.dart';
import '../data/lessons_api.dart';
import '../widgets/youtube_asset_player.dart';
import '../widgets/video_file_asset_player.dart';
import '../widgets/pdf_asset_viewer.dart';
import '../widgets/image_asset_viewer.dart';
import '../widgets/audio_asset_player.dart';
import '../widgets/attachment_tile.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/courses/[courseId]/lessons/[lessonId]/page.tsx
/// Requires auth + course access — checked server-side via the 403 the
/// route returns, and route-guarded client-side via router.dart.
class LessonScreen extends StatefulWidget {
  final String courseId;
  final String lessonId;
  const LessonScreen({super.key, required this.courseId, required this.lessonId});

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  late Future<Lesson> _future;
  bool _completing = false;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    _future = LessonsApi.fetchLesson(widget.lessonId);
  }

  Future<void> _markComplete() async {
    setState(() => _completing = true);
    try {
      await LessonsApi.markComplete(widget.lessonId);
      if (mounted) setState(() => _completed = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  Widget _buildPrimaryAsset(LessonAsset asset) {
    final url = LessonsApi.deliverUrlFor(lessonId: widget.lessonId, assetId: asset.id);
    switch (asset.type) {
      case AssetType.youtube:
        return YoutubeAssetPlayer(videoId: asset.externalId ?? '');
      case AssetType.videoFile:
        return VideoFileAssetPlayer(url: url);
      case AssetType.pdf:
        return PdfAssetViewer(url: url);
      case AssetType.image:
        return ImageAssetViewer(url: url);
      case AssetType.audio:
        return Padding(padding: const EdgeInsets.all(16), child: AudioAssetPlayer(url: url));
      case AssetType.unknown:
        return const EmptyState(icon: Icons.error_outline, message: 'Unsupported content type.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lesson')),
      body: FutureBuilder<Lesson>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.lock_outline,
              message: '${snapshot.error}',
            );
          }

          final lesson = snapshot.data!;
          final primary = lesson.primaryAsset;

          return ListView(
            children: [
              if (primary != null) _buildPrimaryAsset(primary),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(lesson.name, style: Theme.of(context).textTheme.titleLarge),
                    if (lesson.description != null && lesson.description!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(lesson.description!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: (_completing || _completed) ? null : _markComplete,
                      icon: Icon(_completed ? Icons.check_circle : Icons.check_circle_outline),
                      label: Text(_completed ? 'Completed' : 'Mark as complete'),
                    ),
                  ],
                ),
              ),
              if (lesson.attachments.isNotEmpty) ...[
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                  child: Text('Attachments', style: Theme.of(context).textTheme.titleSmall),
                ),
                ...lesson.attachments.map(
                  (a) => AttachmentTile(lessonId: widget.lessonId, asset: a),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}