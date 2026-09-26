import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { keys } from '@/api/keys';
import type { ProductViewerState, WishlistItem } from '@/api/types';
import { api } from '@/api/v1';
import { useAuth } from '@/auth/auth-context';

/**
 * Is this product saved, and a toggle for it — like the website's heart:
 * flips at once, reverts if the server says no. Signed out, tapping it
 * opens sign-in instead.
 */
export function useWishlist(productId: string) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = status === 'signedIn';

  // The saved list is one request for every card on a screen.
  const wishlist = useQuery({ queryKey: keys.me.wishlist, queryFn: api.wishlist, enabled: signedIn });
  const saved = signedIn && (wishlist.data?.some((item) => item.productId === productId) ?? false);

  const mutation = useMutation({
    mutationFn: async (next: boolean): Promise<void> => {
      if (next) await api.addToWishlist(productId);
      else await api.removeFromWishlist(productId);
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: keys.me.wishlist });
      const previous = queryClient.getQueryData<WishlistItem[]>(keys.me.wishlist);
      queryClient.setQueryData<WishlistItem[]>(keys.me.wishlist, (items = []) =>
        next
          ? [...items, { productId } as WishlistItem]
          : items.filter((item) => item.productId !== productId),
      );
      queryClient.setQueryData<ProductViewerState>(keys.me.productState(productId), (state) =>
        state ? { ...state, wishlisted: next } : state,
      );
      return { previous } as { previous: WishlistItem[] | undefined };
    },
    onError: (error, next, context) => {
      queryClient.setQueryData(keys.me.wishlist, context?.previous);
      queryClient.setQueryData<ProductViewerState>(keys.me.productState(productId), (state) =>
        state ? { ...state, wishlisted: !next } : state,
      );
      const message = error instanceof Error ? error.message : "Couldn't update your wishlist.";
      if (Platform.OS === 'web') console.warn(message);
      else Alert.alert('Wishlist', message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.me.wishlist });
    },
  });

  function toggle() {
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    mutation.mutate(!saved);
  }

  return { saved, toggle, pending: mutation.isPending };
}
