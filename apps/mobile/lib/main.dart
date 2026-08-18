import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'core/auth/auth_state.dart';
import 'core/router.dart';
import 'core/theme.dart';

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
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    // Any 401 from the API bounces the user back to sign-in automatically.
    ApiClient.instance.onUnauthorized = _authState.signOut;
    _router = buildRouter(_authState);
    _authState.bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _authState,
      child: MaterialApp.router(
        title: 'paperglidr',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
