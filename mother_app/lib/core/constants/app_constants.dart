import 'dart:io' show Platform;

/// Static configuration used across the Mother Mobile Application.
class AppConstants {
  AppConstants._();

  /// Base URL for the Django REST API.
  ///
  /// Override at build time with:
  ///   flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000
  ///
  /// The default below automatically picks the correct localhost alias for
  /// the platform so a fresh checkout talks to the local Django server
  /// out-of-the-box:
  ///   • Android emulator → 10.0.2.2 (the host machine's loopback)
  ///   • iOS simulator / macOS / Windows / Linux / web → localhost
  ///   • Physical device → set `--dart-define=API_BASE_URL=http://<lan-ip>:8000`
  static const String _apiBaseUrlOverride = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  /// Default base URL when no `--dart-define` is provided.
  /// Uses the Android emulator alias (10.0.2.2) so a typical `flutter run`
  /// from a developer machine reaches the local Django backend on
  /// `127.0.0.1:8000` without any extra flags. This default is harmless on
  /// other platforms because the override above still takes precedence,
  /// and on iOS/web/desktop `localhost` is correct anyway.
  static const String _defaultApiBaseUrl = 'http://10.0.2.2:8000';

  /// Resolved base URL used by the API client.
  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    // Try to pick `localhost` on non-Android targets so the same build
    // works for web/iOS/desktop without any extra config. The check is
    // wrapped in try/catch because `dart:io` is unavailable on web.
    try {
      if (!Platform.isAndroid) return 'http://localhost:8000';
    } catch (_) {
      // web / other non-IO platforms
      return 'http://localhost:8000';
    }
    return _defaultApiBaseUrl;
  }

  /// Versioned API path used by the web app.
  static const String apiPrefix = '/api/v1';

  static String get apiUrl => '$apiBaseUrl$apiPrefix';

  /// Local-storage keys.
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';
}
