// lib/features/products/screens/product_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/product.dart';
import '../data/products_api.dart';
import '../../wishlist/widgets/wishlist_button.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/products/[productId]/page.tsx
/// Public — "Buy" routes to PurchaseCheckoutScreen (auth-gated there).
class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Future<Product> _future;

  @override
  void initState() {
    super.initState();
    _future = ProductsApi.fetchProduct(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Product')),
      body: FutureBuilder<Product>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingIndicator();
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.error_outline,
              message: 'Could not load product.\n${snapshot.error}',
            );
          }

          final product = snapshot.data!;
          final hasRating = product.avgRating != null && product.reviewCount > 0;

          return Stack(
            children: [
              ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  if (product.imageUrl.isNotEmpty)
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: Image.network(product.imageUrl, fit: BoxFit.cover),
                    ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
                            ),
                            WishlistButton(productId: product.id),
                          ],
                        ),
                        if (hasRating) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.star, size: 16, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text('${product.avgRating!.toStringAsFixed(1)} (${product.reviewCount} reviews)'),
                            ],
                          ),
                        ],
                        const SizedBox(height: 12),
                        Text(product.description, style: Theme.of(context).textTheme.bodyMedium),
                        if (product.courses.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Text("What's included", style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          ...product.courses.map(
                            (c) => Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.play_lesson_outlined),
                                title: Text(c.courseName),
                                trailing: const Icon(Icons.chevron_right, size: 20),
                                // Curriculum preview — full lesson access is
                                // still gated server-side per-lesson regardless
                                // of whether the product's been purchased.
                                onTap: () => context.push('/courses/${c.courseId}'),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8)],
                  ),
                  child: SafeArea(
                    top: false,
                    child: FilledButton(
                      onPressed: () {
                        // TODO: context.push('/products/${product.id}/purchase')
                      },
                      child: Text(
                        product.priceInRupees == 0 ? 'Enroll for free' : 'Buy — Rs. ${product.priceInRupees}',
                      ),
                    ),
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