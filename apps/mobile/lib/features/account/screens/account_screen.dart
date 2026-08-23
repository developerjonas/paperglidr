// lib/features/account/screens/account_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../../core/auth/auth_state.dart';
import '../widgets/profile_header.dart';
import '../widgets/account_menu_tile.dart';

/// Mirrors apps/web/src/app/(consumer)/account/page.tsx
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  Future<void> _confirmSignOut(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sign out')),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<AuthState>().signOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                ProfileHeader(user: user),
                const Divider(height: 24),
                AccountMenuTile(
                  icon: Icons.shopping_bag_outlined,
                  title: 'My Purchases',
                  onTap: () => context.push('/purchases'),
                ),
                AccountMenuTile(
                  icon: Icons.favorite_border,
                  title: 'Wishlist',
                  onTap: () => context.go('/wishlist'),
                ),
                AccountMenuTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Certificates',
                  onTap: () => context.push('/certificates'),
                ),
                AccountMenuTile(
                  icon: Icons.support_agent_outlined,
                  title: 'Support',
                  onTap: () => context.push('/support'),
                ),
                const Divider(height: 24),
                AccountMenuTile(
                  icon: Icons.logout,
                  title: 'Sign out',
                  color: Theme.of(context).colorScheme.error,
                  onTap: () => _confirmSignOut(context),
                ),
              ],
            ),
    );
  }
}