import 'api_client.dart';
import '../../models/anc_visit.dart';
import '../../models/appointment.dart';
import '../../models/child_profile.dart';
import '../../models/mother_dashboard.dart';

/// Mirrors `motherApi` in `frontend/src/api/index.ts`.
class MotherApi {
  MotherApi(this._client);

  final ApiClient _client;

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _client.post('/auth/login/', {
      'email': email,
      'password': password,
    });
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _client.get('/users/me/');
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await _client.patch('/users/me/', data);
    return res as Map<String, dynamic>;
  }

  // Patient (mother) data
  Future<MotherDashboardData> dashboard() async {
    final res = await _client.get('/patients/mother/dashboard/');
    return MotherDashboardData.fromJson(res as Map<String, dynamic>);
  }

  Future<List<Appointment>> appointments() async {
    final res = await _client.get('/patients/mother/appointments/');
    return _extractList<Appointment>(res, (json) => Appointment.fromJson(json));
  }

  Future<Appointment> createAppointment({
    required String appointmentType,
    required String scheduledDate,
    String? scheduledTime,
    String? notes,
  }) async {
    final res = await _client.post('/patients/mother/appointments/', {
      'appointment_type': appointmentType,
      'scheduled_date': scheduledDate,
      'scheduled_time': scheduledTime,
      'notes': notes ?? '',
    });
    return Appointment.fromJson(res as Map<String, dynamic>);
  }

  Future<void> rescheduleAppointment(
    int id, {
    required String scheduledDate,
    String? scheduledTime,
    required String reason,
  }) async {
    await _client.post(
      '/patients/mother/appointments/$id/reschedule/',
      {
        'scheduled_date': scheduledDate,
        'scheduled_time': scheduledTime,
        'reason': reason,
      },
    );
  }

  Future<MotherPregnancyTrackingData> pregnancyTracking() async {
    final res = await _client.get('/patients/mother/pregnancy-tracking/');
    return MotherPregnancyTrackingData.fromJson(
        res as Map<String, dynamic>);
  }

  Future<MotherMedicalRecordsData> medicalRecords() async {
    final res = await _client.get('/patients/mother/medical-records/');
    return MotherMedicalRecordsData.fromJson(res as Map<String, dynamic>);
  }

  // Symptoms
  Future<List<SymptomReport>> listSymptoms() async {
    final res = await _client.get('/patients/mother/symptoms/');
    return _extractList<SymptomReport>(res, (json) => SymptomReport.fromJson(json));
  }

  Future<void> reportSymptoms({
    required String symptoms,
    required String description,
    required String severity,
  }) async {
    await _client.post('/patients/mother/symptoms/', {
      'symptoms': symptoms,
      'description': description,
      'severity': severity,
    });
  }

  // Messages (secure messaging with care team)
  Future<List<SecureMessage>> listMessages() async {
    final res = await _client.get('/patients/mother/messages/');
    return _extractList<SecureMessage>(res, (json) => SecureMessage.fromJson(json));
  }

  Future<void> sendMessage(String message, {int? parentMessage}) async {
    await _client.post('/patients/mother/messages/', {
      'message': message,
      'parent_message': parentMessage,
    });
  }

  Future<void> markCareAlertRead(int id) async {
    await _client.post('/patients/mother/care-alerts/$id/read/');
  }

  // ANC visits
  Future<List<ChildProfile>> motherChildren() async {
    final res = await _client.get('/patients/mother/children/');
    return _extractList<ChildProfile>(res, (json) => ChildProfile.fromJson(json));
  }

  Future<List<AncVisit>> listAncVisits() async {
    final res = await _client.get('/clinical/mother/anc-visits/');
    return _extractList<AncVisit>(res, (json) => AncVisit.fromJson(json));
  }

  Future<AncVisit> getAncVisit(int id) async {
    final res = await _client.get('/clinical/mother/anc-visits/$id/');
    return AncVisit.fromJson(res as Map<String, dynamic>);
  }

  // Notifications
  Future<List<AppNotification>> listNotifications() async {
    final res = await _client.get('/tickets/notifications/');
    return _extractList<AppNotification>(
        res, (json) => AppNotification.fromJson(json));
  }

  Future<int> unreadNotificationsCount() async {
    final res = await _client.get('/tickets/notifications/unread_count/');
    return (res as Map<String, dynamic>)['unread_count'] as int? ?? 0;
  }

  Future<void> markNotificationRead(int id) async {
    await _client.patch('/tickets/notifications/$id/read/', {});
  }

  Future<void> markAllNotificationsRead() async {
    await _client.patch('/tickets/notifications/read_all/', {});
  }

  /// Helper to support both DRF paginated (`results`) and plain array responses.
  List<T> _extractList<T>(
      dynamic raw, T Function(Map<String, dynamic>) builder) {
    if (raw is List) {
      return raw
          .map((e) => builder(e as Map<String, dynamic>))
          .toList(growable: false);
    }
    if (raw is Map<String, dynamic>) {
      final list = raw['results'] ?? raw['data'];
      if (list is List) {
        return list
            .map((e) => builder(e as Map<String, dynamic>))
            .toList(growable: false);
      }
    }
    return const [];
  }
}