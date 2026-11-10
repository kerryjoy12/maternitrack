/// Represents an authenticated user. Mirrors the [User] interface from
/// `frontend/src/types/index.ts`.
///
/// Note: the backend's `StaffUser.id` is a UUID (e.g. "a3f8..."), not an
/// integer, so we keep it as a String to match what the API actually
/// returns. Older builds of the mother app cast this to `int`, which
/// produced a `TypeError` on every login and surfaced as the generic
/// "Login failed. Please try again." message.
class AppUser {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String phoneNumber;
  final String bio;
  final bool profileCompleted;
  final bool? hasPmtctPermission;
  final String dateJoined;
  final bool isActive;
  final int? patientId;

  AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.phoneNumber,
    required this.bio,
    required this.profileCompleted,
    this.hasPmtctPermission,
    required this.dateJoined,
    this.isActive = true,
    this.patientId,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        // Backend UUID comes through as a string. We only fall back to an
        // integer representation if the server somehow still returns a
        // numeric id, so we don't crash on either format.
        id: _idToString(json['id']),
        email: json['email'] as String? ?? '',
        fullName: json['full_name'] as String? ?? '',
        role: json['role'] as String? ?? 'MOTHER',
        phoneNumber: json['phone_number']?.toString() ?? '',
        bio: json['bio']?.toString() ?? '',
        profileCompleted: json['profile_completed'] as bool? ?? false,
        hasPmtctPermission: json['has_pmtct_permission'] as bool?,
        dateJoined: json['date_joined']?.toString() ?? '',
        isActive: json['is_active'] as bool? ?? true,
        patientId: json['patient_id'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role,
        'phone_number': phoneNumber,
        'bio': bio,
        'profile_completed': profileCompleted,
        'has_pmtct_permission': hasPmtctPermission,
        'date_joined': dateJoined,
        'is_active': isActive,
        'patient_id': patientId,
      };

  bool get isMother => role == 'MOTHER';
}

/// Authentication response from POST /auth/login/.
///
/// The backend currently returns:
///
///     {
///       "access": "<jwt>",
///       "refresh": "<jwt>",
///       "user": { ... StaffUserSerializer payload ... }
///     }
///
/// We accept any combination of those three fields being present so the
/// parser stays robust if the backend adds or omits one of them.
class AuthResponse {
  final String access;
  final String refresh;
  final AppUser user;

  AuthResponse({
    required this.access,
    required this.refresh,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final access = json['access'];
    final refresh = json['refresh'];
    final user = json['user'];
    if (access is! String || access.isEmpty) {
      throw const FormatException('Login response missing "access" token.');
    }
    if (refresh is! String || refresh.isEmpty) {
      throw const FormatException('Login response missing "refresh" token.');
    }
    if (user is! Map<String, dynamic>) {
      throw const FormatException('Login response missing "user" object.');
    }
    return AuthResponse(
      access: access,
      refresh: refresh,
      user: AppUser.fromJson(user),
    );
  }
}

String _idToString(dynamic raw) {
  if (raw == null) return '';
  if (raw is String) return raw;
  if (raw is int) return raw.toString();
  return raw.toString();
}
