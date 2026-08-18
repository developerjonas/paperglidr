import 'package:flutter/material.dart';

/// Mirrors components/LoadingSpinner.tsx — use anywhere you're awaiting
/// an ApiClient call.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}
