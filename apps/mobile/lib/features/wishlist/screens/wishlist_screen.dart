// lib/features/wishlist/screens/wishlist_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data/wishlist_item.dart';
import '../data/wishlist_state.dart';
import '../data/wishlist_api.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/loading_indicator.dart';

/// Mirrors apps/web/src/app/(consumer)/wishlist/page.tsx
class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  late Future<List<WishlistItem>> _future;

  @override
  void initState() {
    super.initState();
    _future = WishlistApi.fetchMyWishlist();
  }

  Future<void> _refresh() async {
    final next = WishlistApi.fetchMyWishlist();
    setState(() => _future = next);
    await next;
  }

  Future<void> _remove(WishlistItem item) async {
    try {
      await context.read<WishlistState>().toggle(item.productId); // it's currently wishlisted, so toggle removes it
      setState(() => _future = WishlistApi.fetchMyWishlist());
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not remove item.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<WishlistItem>>(
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
                    message: 'Could not load wishlist.\n${snapshot.error}',
                  ),
                ],
              );
            }
            final items = snapshot.data ?? [];
            if (items.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyState(
                    icon: Icons.favorite_border,
                    message: 'Nothing here yet — tap the heart on a course to save it.',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                final item = items[i];
                return Dismissible(
                  key: ValueKey(item.wishlistItemId),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    color: Colors.red,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) => _remove(item),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: ListTile(
                      leading: item.imageUrl.isEmpty
                          ? null
                          : ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                item.imageUrl,
                                width: 56,
                                height: 56,
                                fit: BoxFit.cover,
                              ),
                            ),
                      title: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: Text(
                        item.priceInRupees == 0 ? 'Free' : 'Rs. ${item.priceInRupees}',
                      ),
                      onTap: () => context.push('/courses/${item.productId}'),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}