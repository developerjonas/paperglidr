// lib/main.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'core/auth/auth_state.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'features/wishlist/data/wishlist_state.dart';

void main() {
  runApp(const PaperglidrApp());
}

class PaperglidrApp extends StatefulWidget {
  const PaperglidrApp({super.key});

  @override
  State<PaperglidrApp> createState() => _PaperglidrAppState();
}

class _PaperglidrAppState extends State<PaperglidrApp> {
  final _authState = AuthState();
  final _wishlistState = WishlistState();
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    ApiClient.instance.onUnauthorized = () async {
      await _authState.signOut();
      _wishlistState.clear();
    };
    _router = buildRouter(_authState);
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await _authState.bootstrap();
      if (_authState.status == AuthStatus.authenticated) {
        await _wishlistState.load();
      }
    } catch (e, st) {
      // Restoring a saved session failed (corrupt token, etc). Fail safe
      // into "signed out" rather than leaving the app stuck loading.
      debugPrint('Auth bootstrap failed: $e\n$st');
      await _authState.signOut();
    }
  }

  @override
  void dispose() {
    _authState.dispose();
    _wishlistState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authState),
        ChangeNotifierProvider.value(value: _wishlistState),
      ],
      child: MaterialApp.router(
        title: 'paperglidr',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}