import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/auth/auth_state.dart';

/// Mirrors apps/web/src/app/(consumer)/account/page.tsx
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(auth.userEmail ?? 'Signed in'),
          ),
          ListTile(
            title: const Text('Sign out'),
            leading: const Icon(Icons.logout),
            onTap: () => context.read<AuthState>().signOut(),
          ),
        ],
      ),
    );
  }
}
