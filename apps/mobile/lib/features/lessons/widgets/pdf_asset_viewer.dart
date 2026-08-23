// lib/features/lessons/widgets/pdf_asset_viewer.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/auth/request_headers.dart';

/// Renders the PDF inside a WebView (relies on the platform browser
/// engine's built-in PDF support — solid on iOS, generally fine on
/// Android). A dedicated PDF-rendering package is a future upgrade if
/// you need more control (page thumbnails, search, etc).
class PdfAssetViewer extends StatefulWidget {
  final String url;
  const PdfAssetViewer({super.key, required this.url});

  @override
  State<PdfAssetViewer> createState() => _PdfAssetViewerState();
}

class _PdfAssetViewerState extends State<PdfAssetViewer> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(onPageFinished: (_) => setState(() => _loading = false)),
      );
    _load();
  }

  Future<void> _load() async {
    final headers = await RequestHeaders.auth();
    _controller.loadRequest(Uri.parse(widget.url), headers: headers);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 500,
      child: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}