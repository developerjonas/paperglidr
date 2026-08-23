// lib/features/wishlist/widgets/wishlist_button.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/wishlist_state.dart';
import '../../../core/auth/auth_state.dart';
import 'package:go_router/go_router.dart';

/// Mirrors features/wishlist/components/WishlistButton.tsx — drop this
/// onto CourseCard, ProductDetailScreen, wherever a heart toggle makes sense.
class WishlistButton extends StatelessWidget {
  final String productId;
  const WishlistButton({super.key, required this.productId});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final wishlist = context.watch<WishlistState>();
    final isWishlisted = wishlist.isWishlisted(productId);

    return Material(
      color: Colors.white.withValues(alpha: 0.85),
      shape: const CircleBorder(),
      child: IconButton(
        icon: Icon(
          isWishlisted ? Icons.favorite : Icons.favorite_border,
          color: isWishlisted ? Colors.red : Colors.black87,
        ),
        onPressed: () async {
          if (auth.status != AuthStatus.authenticated) {
            GoRouter.of(context).push('/sign-in');
            return;
          }
          try {
            await context.read<WishlistState>().toggle(productId);
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Could not update wishlist.')),
              );
            }
          }
        },
      ),
    );
  }
}