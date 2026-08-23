// lib/features/lessons/widgets/attachment_tile.dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/lesson_asset.dart';
import '../data/lessons_api.dart';
import '../../../core/auth/secure_storage.dart';

class AttachmentTile extends StatelessWidget {
  final String lessonId;
  final LessonAsset asset;
  const AttachmentTile({super.key, required this.lessonId, required this.asset});

  Future<void> _open(BuildContext context) async {
    final url = LessonsApi.deliverUrlFor(lessonId: lessonId, assetId: asset.id);
    // url_launcher can't attach custom headers for external-app opens, so
    // we append the token as a query param the deliver route can also
    // accept as a fallback. If your deliver route only reads the
    // Authorization header, swap this for an in-app download via
    // ApiClient.instance.get() + writing bytes to a temp file instead.
    final token = await TokenStorage.instance.readToken();
    final uri = Uri.parse(url).replace(queryParameters: {if (token != null) 'token': token});
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open attachment.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const Icon(Icons.attach_file),
      title: Text(asset.fileName ?? 'Attachment', maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: const Icon(Icons.download_outlined),
      onTap: () => _open(context),
    );
  }
}