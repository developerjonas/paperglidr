// lib/features/wishlist/data/wishlist_state.dart
import 'package:flutter/foundation.dart';
import 'wishlist_api.dart';
import 'wishlist_item.dart';

/// Single source of truth for "what's wishlisted" across the whole app.
/// Register once in main.dart alongside AuthState so every WishlistButton
/// (on CourseCard, ProductDetail, wherever) reflects the same state.
class WishlistState extends ChangeNotifier {
  Set<String> _productIds = {};
  bool _loaded = false;

  bool isWishlisted(String productId) => _productIds.contains(productId);

  Future<void> load() async {
    try {
      final items = await WishlistApi.fetchMyWishlist();
      _productIds = items.map((i) => i.productId).toSet();
      _loaded = true;
      notifyListeners();
    } catch (_) {
      // Signed out or offline — leave empty rather than crash the app.
      _loaded = true;
    }
  }

  /// Call after sign-out so a new user doesn't see the previous user's hearts.
  void clear() {
    _productIds = {};
    _loaded = false;
    notifyListeners();
  }

  Future<void> toggle(String productId) async {
    final wasWishlisted = _productIds.contains(productId);
    // Optimistic update first — instant heart-fill feel.
    if (wasWishlisted) {
      _productIds.remove(productId);
    } else {
      _productIds.add(productId);
    }
    notifyListeners();

    try {
      if (wasWishlisted) {
        await WishlistApi.remove(productId);
      } else {
        await WishlistApi.add(productId);
      }
    } catch (_) {
      // Revert on failure.
      if (wasWishlisted) {
        _productIds.add(productId);
      } else {
        _productIds.remove(productId);
      }
      notifyListeners();
      rethrow;
    }
  }

  bool get loaded => _loaded;
}