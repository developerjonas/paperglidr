// lib/features/account/widgets/account_menu_tile.dart
import 'package:flutter/material.dart';

class AccountMenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? color;

  const AccountMenuTile({
    super.key,
    required this.icon,
    required this.title,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: TextStyle(color: color)),
      trailing: color == null ? const Icon(Icons.chevron_right, size: 20) : null,
      onTap: onTap,
    );
  }
}