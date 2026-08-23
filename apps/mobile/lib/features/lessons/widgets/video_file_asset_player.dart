// lib/features/lessons/widgets/video_file_asset_player.dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../../../core/auth/request_headers.dart';

class VideoFileAssetPlayer extends StatefulWidget {
  final String url;
  const VideoFileAssetPlayer({super.key, required this.url});

  @override
  State<VideoFileAssetPlayer> createState() => _VideoFileAssetPlayerState();
}

class _VideoFileAssetPlayerState extends State<VideoFileAssetPlayer> {
  VideoPlayerController? _controller;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final headers = await RequestHeaders.auth();
      final controller = VideoPlayerController.networkUrl(Uri.parse(widget.url), httpHeaders: headers);
      await controller.initialize();
      if (!mounted) return;
      setState(() => _controller = controller);
      controller.play();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return AspectRatio(
        aspectRatio: 16 / 9,
        child: Container(
          color: Colors.black12,
          child: Center(child: Text('Could not load video.\n$_error', textAlign: TextAlign.center)),
        ),
      );
    }
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const AspectRatio(aspectRatio: 16 / 9, child: Center(child: CircularProgressIndicator()));
    }
    return AspectRatio(
      aspectRatio: controller.value.aspectRatio,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          VideoPlayer(controller),
          VideoProgressIndicator(controller, allowScrubbing: true),
          Positioned(
            child: IconButton(
              icon: Icon(controller.value.isPlaying ? Icons.pause_circle : Icons.play_circle, size: 48),
              color: Colors.white,
              onPressed: () => setState(() {
                controller.value.isPlaying ? controller.pause() : controller.play();
              }),
            ),
          ),
        ],
      ),
    );
  }
}