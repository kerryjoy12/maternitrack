/// Mother / patient appointment, mirrors `Appointment` from frontend types.
class Appointment {
  final int id;
  final int patient;
  final String patientName;
  final String patientNumber;
  final String patientPhone;
  final String appointmentType;
  final String scheduledDate;
  final String? scheduledTime;
  final String? attendedDate;
  final String status;
  final String notes;
  final String? createdBy;
  final String? createdByName;
  final String createdAt;
  final String updatedAt;

  Appointment({
    required this.id,
    required this.patient,
    required this.patientName,
    required this.patientNumber,
    required this.patientPhone,
    required this.appointmentType,
    required this.scheduledDate,
    this.scheduledTime,
    this.attendedDate,
    required this.status,
    required this.notes,
    this.createdBy,
    this.createdByName,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) => Appointment(
        id: json['id'] as int,
        patient: json['patient'] as int,
        patientName: json['patient_name']?.toString() ?? '',
        patientNumber: json['patient_number']?.toString() ?? '',
        patientPhone: json['patient_phone']?.toString() ?? '',
        appointmentType: json['appointment_type']?.toString() ?? 'OTHER',
        scheduledDate: json['scheduled_date']?.toString() ?? '',
        scheduledTime: json['scheduled_time']?.toString(),
        attendedDate: json['attended_date']?.toString(),
        status: json['status']?.toString() ?? 'UPCOMING',
        notes: json['notes']?.toString() ?? '',
        createdBy: _stringify(json['created_by']),
        createdByName: json['created_by_name']?.toString(),
        createdAt: json['created_at']?.toString() ?? '',
        updatedAt: json['updated_at']?.toString() ?? '',
      );

  static String? _stringify(dynamic value) {
    if (value == null) return null;
    return value.toString();
  }

  /// Group used by the Appointments tabs (Attended / Pending / Missed).
  String get statusGroup {
    switch (status) {
      case 'ATTENDED':
        return 'ATTENDED';
      case 'MISSED':
        return 'MISSED';
      default:
        // UPCOMING, RESCHEDULED, CANCELLED all fall under Pending
        return 'PENDING';
    }
  }

  String get friendlyType =>
      appointmentType.replaceAll('_', ' ').toLowerCase();
}