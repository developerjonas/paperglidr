// lib/features/courses/screens/browse_screen.dart
import 'package:flutter/material.dart';
import '../../products/data/product.dart';
import '../../products/data/products_api.dart';
import '../../products/widgets/product_card.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/browse/page.tsx
/// Public — hits /api/v1/products, no bearer token attached.
/// Shows the purchasable product catalog (course bundles), not the
/// user's owned courses — that's HomeScreen.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  late Future<List<Product>> _future;

  @override
  void initState() {
    super.initState();
    _future = ProductsApi.fetchPublicProducts();
  }

  Future<void> _refresh() async {
    final next = ProductsApi.fetchPublicProducts();
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Browse')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<Product>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const LoadingIndicator();
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  const SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.error_outline,
                    message: 'Could not load products.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final products = snapshot.data ?? [];
            if (products.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(message: 'No products published yet.'),
                ],
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: products.length,
              itemBuilder: (context, i) => ProductCard(product: products[i]),
            );
          },
        ),
      ),
    );
  }
}