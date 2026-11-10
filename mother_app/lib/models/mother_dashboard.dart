import 'appointment.dart';

/// Subset of types used by the mother dashboard. Mirrors the
/// `MotherDashboardData`, `UpcomingVaccine` and `SecureMessage` interfaces
/// from the web app.
class UpcomingVaccine {
  final String target;
  final String vaccineName;
  final int? recommendedWeek;
  final String status;
  final String? expectedDate;

  UpcomingVaccine({
    required this.target,
    required this.vaccineName,
    this.recommendedWeek,
    required this.status,
    this.expectedDate,
  });

  factory UpcomingVaccine.fromJson(Map<String, dynamic> json) =>
      UpcomingVaccine(
        target: json['target']?.toString() ?? '',
        vaccineName: json['vaccine_name']?.toString() ?? '',
        recommendedWeek: json['recommended_week'] as int?,
        status: json['status']?.toString() ?? 'UPCOMING',
        expectedDate: json['expected_date']?.toString(),
      );
}

class CareAlert {
  final int id;
  final int sender;
  final String? senderName;
  final String? senderRole;
  final int? recipient;
  final int patient;
  final String? messageType;
  final int? clinicalAlert;
  final String message;
  final String createdAt;
  final bool isRead;
  final int? parentMessage;

  CareAlert({
    required this.id,
    required this.sender,
    this.senderName,
    this.senderRole,
    this.recipient,
    required this.patient,
    this.messageType,
    this.clinicalAlert,
    required this.message,
    required this.createdAt,
    required this.isRead,
    this.parentMessage,
  });

  factory CareAlert.fromJson(Map<String, dynamic> json) => CareAlert(
        id: json['id'] as int,
        sender: json['sender'] as int? ?? 0,
        senderName: json['sender_name']?.toString(),
        senderRole: json['sender_role']?.toString(),
        recipient: json['recipient'] as int?,
        patient: json['patient'] as int? ?? 0,
        messageType: json['message_type']?.toString(),
        clinicalAlert: json['clinical_alert'] as int?,
        message: json['message']?.toString() ?? '',
        createdAt: json['created_at']?.toString() ?? '',
        isRead: json['is_read'] as bool? ?? false,
        parentMessage: json['parent_message'] as int?,
      );
}

class MotherDashboardData {
  final String pregnancyStatus;
  final int gestationalAgeWeeks;
  final String expectedDeliveryDate;
  final String? trimester;
  final Appointment? nextAppointment;
  final List<UpcomingVaccine> upcomingVaccines;
  final int unreadMessagesCount;
  final List<CareAlert> careAlerts;
  final String riskLevel;

  MotherDashboardData({
    required this.pregnancyStatus,
    required this.gestationalAgeWeeks,
    required this.expectedDeliveryDate,
    this.trimester,
    this.nextAppointment,
    required this.upcomingVaccines,
    required this.unreadMessagesCount,
    required this.careAlerts,
    required this.riskLevel,
  });

  factory MotherDashboardData.fromJson(Map<String, dynamic> json) =>
      MotherDashboardData(
        pregnancyStatus: json['pregnancy_status']?.toString() ?? '',
        gestationalAgeWeeks: json['gestational_age_weeks'] as int? ?? 0,
        expectedDeliveryDate:
            json['expected_delivery_date']?.toString() ?? '',
        trimester: json['trimester']?.toString(),
        nextAppointment: json['next_appointment'] != null
            ? Appointment.fromJson(
                json['next_appointment'] as Map<String, dynamic>)
            : null,
        upcomingVaccines: ((json['upcoming_vaccines'] as List?) ?? [])
            .map((e) => UpcomingVaccine.fromJson(e as Map<String, dynamic>))
            .toList(),
        unreadMessagesCount: json['unread_messages_count'] as int? ?? 0,
        careAlerts: ((json['care_alerts'] as List?) ?? [])
            .map((e) => CareAlert.fromJson(e as Map<String, dynamic>))
            .toList(),
        riskLevel: json['risk_level']?.toString() ?? 'LOW',
      );
}

/// Pregnancy milestone shown in the timeline.
class PregnancyMilestone {
  final String id;
  final String name;
  final bool completed;
  final String? date;

  PregnancyMilestone({
    required this.id,
    required this.name,
    required this.completed,
    this.date,
  });

  factory PregnancyMilestone.fromJson(Map<String, dynamic> json) =>
      PregnancyMilestone(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        completed: json['completed'] as bool? ?? false,
        date: json['date']?.toString(),
      );
}

class MotherPregnancyTrackingData {
  final int? weeksPregnant;
  final String edd;
  final String lmp;
  final String? trimesterInfo;
  final List<PregnancyMilestone> milestones;
  final List<dynamic> ancVisits;

  MotherPregnancyTrackingData({
    this.weeksPregnant,
    required this.edd,
    required this.lmp,
    this.trimesterInfo,
    required this.milestones,
    required this.ancVisits,
  });

  factory MotherPregnancyTrackingData.fromJson(Map<String, dynamic> json) =>
      MotherPregnancyTrackingData(
        weeksPregnant: json['weeks_pregnant'] as int?,
        edd: json['edd']?.toString() ?? '',
        lmp: json['lmp']?.toString() ?? '',
        trimesterInfo: json['trimester_info']?.toString(),
        milestones: ((json['milestones'] as List?) ?? [])
            .map((e) => PregnancyMilestone.fromJson(e as Map<String, dynamic>))
            .toList(),
        ancVisits: (json['anc_visits'] as List?) ?? [],
      );
}

class MotherMedicalRecordsData {
  final dynamic demographicsAndHistory;
  final List<dynamic> clinicalNotes;
  final List<dynamic> uploadedDocuments;

  MotherMedicalRecordsData({
    required this.demographicsAndHistory,
    required this.clinicalNotes,
    required this.uploadedDocuments,
  });

  factory MotherMedicalRecordsData.fromJson(Map<String, dynamic> json) =>
      MotherMedicalRecordsData(
        demographicsAndHistory: json['demographics_and_history'],
        clinicalNotes: (json['clinical_notes'] as List?) ?? [],
        uploadedDocuments: (json['uploaded_documents'] as List?) ?? [],
      );
}

class SymptomReport {
  final int id;
  final int patient;
  final String symptoms;
  final String description;
  final String severity;
  final String reportedAt;
  final String status;
  final int? reviewedBy;
  final String? reviewedAt;
  final String notes;

  SymptomReport({
    required this.id,
    required this.patient,
    required this.symptoms,
    required this.description,
    required this.severity,
    required this.reportedAt,
    required this.status,
    this.reviewedBy,
    this.reviewedAt,
    required this.notes,
  });

  factory SymptomReport.fromJson(Map<String, dynamic> json) => SymptomReport(
        id: json['id'] as int,
        patient: json['patient'] as int? ?? 0,
        symptoms: json['symptoms']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        severity: json['severity']?.toString() ?? 'LOW',
        reportedAt: json['reported_at']?.toString() ?? '',
        status: json['status']?.toString() ?? 'PENDING',
        reviewedBy: json['reviewed_by'] as int?,
        reviewedAt: json['reviewed_at']?.toString(),
        notes: json['notes']?.toString() ?? '',
      );
}

class SecureMessage {
  final int id;
  final int sender;
  final String? senderName;
  final String? senderRole;
  final int? recipient;
  final int patient;
  final String message;
  final String createdAt;
  final bool isRead;
  final int? parentMessage;

  SecureMessage({
    required this.id,
    required this.sender,
    this.senderName,
    this.senderRole,
    this.recipient,
    required this.patient,
    required this.message,
    required this.createdAt,
    required this.isRead,
    this.parentMessage,
  });

  factory SecureMessage.fromJson(Map<String, dynamic> json) => SecureMessage(
        id: json['id'] as int,
        sender: json['sender'] as int? ?? 0,
        senderName: json['sender_name']?.toString(),
        senderRole: json['sender_role']?.toString(),
        recipient: json['recipient'] as int?,
        patient: json['patient'] as int? ?? 0,
        message: json['message']?.toString() ?? '',
        createdAt: json['created_at']?.toString() ?? '',
        isRead: json['is_read'] as bool? ?? false,
        parentMessage: json['parent_message'] as int?,
      );
}

class AppNotification {
  final int id;
  final int user;
  final String userEmail;
  final int? ticket;
  final String? ticketTitle;
  final String message;
  final bool isRead;
  final String createdAt;

  AppNotification({
    required this.id,
    required this.user,
    required this.userEmail,
    this.ticket,
    this.ticketTitle,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json['id'] as int,
        user: json['user'] as int? ?? 0,
        userEmail: json['user_email']?.toString() ?? '',
        ticket: json['ticket'] as int?,
        ticketTitle: json['ticket_title']?.toString(),
        message: json['message']?.toString() ?? '',
        isRead: json['is_read'] as bool? ?? false,
        createdAt: json['created_at']?.toString() ?? '',
      );
}