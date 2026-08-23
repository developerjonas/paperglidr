// lib/features/lessons/widgets/image_asset_viewer.dart
import 'package:flutter/material.dart';
import '../../../core/auth/request_headers.dart';

class ImageAssetViewer extends StatelessWidget {
  final String url;
  const ImageAssetViewer({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String>>(
      future: RequestHeaders.auth(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const AspectRatio(aspectRatio: 4 / 3, child: Center(child: CircularProgressIndicator()));
        }
        return Image.network(
          url,
          headers: snapshot.data,
          errorBuilder: (context, error, stack) => const AspectRatio(
            aspectRatio: 4 / 3,
            child: Center(child: Icon(Icons.broken_image_outlined, size: 48)),
          ),
        );
      },
    );
  }
}