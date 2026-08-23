// lib/features/lessons/widgets/youtube_asset_player.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class YoutubeAssetPlayer extends StatefulWidget {
  final String videoId;
  const YoutubeAssetPlayer({super.key, required this.videoId});

  @override
  State<YoutubeAssetPlayer> createState() => _YoutubeAssetPlayerState();
}

class _YoutubeAssetPlayerState extends State<YoutubeAssetPlayer> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(Uri.parse('https://www.youtube.com/embed/${widget.videoId}?playsinline=1'));
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(aspectRatio: 16 / 9, child: WebViewWidget(controller: _controller));
  }
}