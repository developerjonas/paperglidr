// lib/features/products/widgets/product_card.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../data/product.dart';
import '../../wishlist/widgets/wishlist_button.dart';

/// Mirrors apps/web/src/features/products/components/ProductCard.tsx
class ProductCard extends StatelessWidget {
  final Product product;
  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final hasRating = product.avgRating != null && product.reviewCount > 0;
    final muted = Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/products/${product.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: product.imageUrl.isEmpty
                      ? Container(color: Theme.of(context).colorScheme.surfaceContainerHighest)
                      : Image.network(product.imageUrl, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: WishlistButton(productId: product.id),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    product.priceInRupees == 0 ? 'Free' : 'Rs. ${product.priceInRupees}',
                    style: muted,
                  ),
                  if (hasRating)
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 2),
                        Text(
                          '${product.avgRating!.toStringAsFixed(1)} (${product.reviewCount})',
                          style: muted,
                        ),
                      ],
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
              child: Text(
                product.name,
                style: Theme.of(context).textTheme.titleMedium,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 2, 12, 12),
              child: Text(
                product.description,
                style: muted,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}