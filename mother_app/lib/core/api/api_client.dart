import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';

/// Thrown whenever the API returns a non-success status or fails.
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic raw;

  ApiException(this.statusCode, this.message, [this.raw]);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Lightweight HTTP wrapper that mirrors the behaviour of the web app's
/// `frontend/src/api/index.ts` axios instance:
///  * Adds `Authorization: Bearer <access>` on every request.
///  * Automatically refreshes the access token on 401 responses.
class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  String? _accessToken;
  String? _refreshToken;
  bool _initialized = false;

  Future<void> _ensureInit() async {
    if (_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString(AppConstants.accessTokenKey);
    _refreshToken = prefs.getString(AppConstants.refreshTokenKey);
    _initialized = true;
  }

  Future<void> setTokens({
    required String access,
    required String refresh,
  }) async {
    _accessToken = access;
    _refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.accessTokenKey, access);
    await prefs.setString(AppConstants.refreshTokenKey, refresh);
  }

  Future<void> updateAccessToken(String access) async {
    _accessToken = access;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.accessTokenKey, access);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.accessTokenKey);
    await prefs.remove(AppConstants.refreshTokenKey);
    await prefs.remove(AppConstants.userKey);
  }

  bool get hasToken => _accessToken != null && _accessToken!.isNotEmpty;

  Map<String, String> _headers({bool json = true}) {
    final headers = <String, String>{};
    if (json) headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
    if (_accessToken != null && _accessToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final base = Uri.parse(AppConstants.apiBaseUrl);
    final queryParams = query?.map((k, v) => MapEntry(k, v.toString()));
    return base.replace(
      path: '${AppConstants.apiPrefix}$path',
      queryParameters: queryParams,
    );
  }

  Future<dynamic> _send(Future<http.Response> Function() fn) async {
    await _ensureInit();
    http.Response response;
    try {
      response = await fn().timeout(const Duration(seconds: 30));
    } on TimeoutException {
      throw ApiException(
        0,
        'Request timed out. The server at ${AppConstants.apiBaseUrl} '
            'is not responding.',
      );
    } catch (e) {
      // Surface the target base URL in the error so the user can immediately
      // see which host the app is trying to reach and fix the
      // --dart-define=API_BASE_URL=... override if needed.
      throw ApiException(
        0,
        'Network error. Could not reach ${AppConstants.apiBaseUrl}. '
            'Make sure the backend is running and the URL is correct '
            '(Android emulator must use http://10.0.2.2:<port>).',
        e,
      );
    }

    // 401 → try refresh once
    if (response.statusCode == 401 && _refreshToken != null) {
      final refreshed = await _attemptRefresh();
      if (refreshed) {
        return _send(fn);
      } else {
        await clearTokens();
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return response.body;
      }
    }

    String message = 'Request failed (${response.statusCode}).';
    dynamic raw;
    try {
      raw = jsonDecode(response.body);
      if (raw is Map && raw['detail'] != null) {
        message = raw['detail'].toString();
      } else if (raw is Map) {
        final first = raw.values.first;
        if (first is List && first.isNotEmpty) {
          message = first.first.toString();
        }
      } else if (raw is String && raw.isNotEmpty) {
        message = raw;
      }
    } catch (_) {
      // fall through with default message
    }
    throw ApiException(response.statusCode, message, raw);
  }

  Future<bool> _attemptRefresh() async {
    if (_refreshToken == null) return false;
    try {
      final res = await http
          .post(
            _uri('/auth/refresh/'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refresh': _refreshToken}),
          )
          .timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['access'] != null) {
          await updateAccessToken(data['access'] as String);
          return true;
        }
      }
    } catch (_) {
      // ignored
    }
    return false;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send(() => http.get(_uri(path, query), headers: _headers()));
  }

  Future<dynamic> post(String path, [Object? body]) {
    return _send(() => http.post(
          _uri(path),
          headers: _headers(),
          body: body == null ? null : jsonEncode(body),
        ));
  }

  Future<dynamic> patch(String path, [Object? body]) {
    return _send(() => http.patch(
          _uri(path),
          headers: _headers(),
          body: body == null ? null : jsonEncode(body),
        ));
  }

  Future<dynamic> delete(String path) {
    return _send(() => http.delete(_uri(path), headers: _headers()));
  }
}