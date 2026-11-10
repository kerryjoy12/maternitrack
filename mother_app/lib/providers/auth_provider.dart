import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api/api_client.dart';
import '../core/api/mother_api.dart';
import '../core/constants/app_constants.dart';
import '../models/user.dart';

/// Holds authentication state for the mother portal. Mirrors the behaviour
/// of `frontend/src/context/AuthContext.tsx`.
class AuthProvider extends ChangeNotifier {
  AuthProvider({ApiClient? client, MotherApi? api})
      : _client = client ?? ApiClient.instance,
        _api = api ?? MotherApi(client ?? ApiClient.instance);

  final ApiClient _client;
  final MotherApi _api;

  AppUser? _user;
  bool _initializing = true;
  bool _busy = false;
  String? _error;

  AppUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isInitializing => _initializing;
  bool get isBusy => _busy;
  String? get error => _error;

  /// Read persisted tokens/user on app start so we can keep the user signed
  /// in across launches (exactly like the web app).
  Future<void> bootstrap() async {
    _initializing = true;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(AppConstants.userKey);
    if (raw != null) {
      try {
        _user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {
        _user = null;
      }
    }
    _initializing = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.login(email, password);
      final auth = AuthResponse.fromJson(res);
      await _client.setTokens(access: auth.access, refresh: auth.refresh);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        AppConstants.userKey,
        jsonEncode(auth.user.toJson()),
      );
      _user = auth.user;
      return true;
    } on ApiException catch (e) {
      _error = _humanize(e);
      return false;
    } on FormatException catch (e) {
      // The backend returned something we couldn't parse (e.g. a schema
      // change). Surface the real reason so the user / developer can
      // diagnose it instead of seeing a generic "Login failed" message.
      _error = 'Login response was invalid: ${e.message}';
      if (kDebugMode) {
        debugPrint('AuthProvider.login parse error: ${e.message}');
      }
      return false;
    } catch (e) {
      _error = 'Login failed. Please try again.';
      if (kDebugMode) {
        debugPrint('AuthProvider.login unexpected error: $e');
      }
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    try {
      final res = await _api.me();
      _user = AppUser.fromJson(res);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        AppConstants.userKey,
        jsonEncode(_user!.toJson()),
      );
      notifyListeners();
    } catch (_) {
      // silently ignore – dashboard will surface its own errors
    }
  }

  Future<void> logout() async {
    await _client.clearTokens();
    _user = null;
    notifyListeners();
  }

  String _humanize(ApiException e) {
    if (e.statusCode == 401) {
      return 'Invalid email or password.';
    }
    if (e.statusCode == 0) {
      return e.message; // network / timeout
    }
    return e.message;
  }
}
