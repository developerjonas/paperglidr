// lib/features/account/widgets/profile_header.dart
import 'package:flutter/material.dart';
import '../../../core/auth/auth_state.dart';

class ProfileHeader extends StatelessWidget {
  final AppUser user;
  const ProfileHeader({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final initial = user.name.isNotEmpty
        ? user.name[0].toUpperCase()
        : (user.email.isNotEmpty ? user.email[0].toUpperCase() : '?');

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(
        children: [
          CircleAvatar(radius: 32, child: Text(initial, style: const TextStyle(fontSize: 24))),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name.isNotEmpty ? user.name : 'No name set',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 2),
                Text(user.email, style: Theme.of(context).textTheme.bodyMedium),
                if (!user.emailVerified) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Email not verified',
                    style: TextStyle(color: Colors.orange.shade700, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}