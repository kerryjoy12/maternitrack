import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api/api_client.dart';
import 'core/api/mother_api.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/shell/mother_shell.dart';
import 'widgets/phone_frame.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MotherApp());
}

/// Top-level MaterniTrack Mother app. Wraps the entire UI in a
/// [MultiProvider] so every screen can reach the API and auth state.
class MotherApp extends StatelessWidget {
  const MotherApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = ApiClient.instance;
    final motherApi = MotherApi(apiClient);

    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        Provider<MotherApi>.value(value: motherApi),
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(client: apiClient, api: motherApi)
            ..bootstrap(),
        ),
      ],
      child: MaterialApp(
        title: 'MaterniTrack Mother',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const _Root(),
      ),
    );
  }
}

/// Resolves between [LoginScreen] and [MotherShell] based on auth state.
/// On Flutter Web the UI is wrapped in a phone-frame for preview purposes.
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    Widget child;
    if (auth.isInitializing) {
      child = const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    } else if (auth.isAuthenticated) {
      child = const MotherShell();
    } else {
      child = const LoginScreen();
    }
    // On web, wrap the UI in a phone-frame for realistic preview.
    if (kIsWeb) {
      return PhoneFrame(child: child);
    }
    return child;
  }
}