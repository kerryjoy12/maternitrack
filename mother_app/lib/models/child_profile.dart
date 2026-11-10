import '../core/utils/json_utils.dart';

class VaccinationRecord {
  final int id;
  final String vaccineName;
  final String vaccineNameDisplay;
  final String status;
  final String? expectedDate;
  final String? givenDate;
  final String notes;

  VaccinationRecord({
    required this.id,
    required this.vaccineName,
    required this.vaccineNameDisplay,
    required this.status,
    this.expectedDate,
    this.givenDate,
    required this.notes,
  });

  factory VaccinationRecord.fromJson(Map<String, dynamic> json) =>
      VaccinationRecord(
        id: parseIntOr(json['id']),
        vaccineName: parseString(json['vaccine_name']),
        vaccineNameDisplay: parseString(json['vaccine_name_display']),
        status: parseString(json['status'], fallback: 'PENDING'),
        expectedDate: json['expected_date']?.toString(),
        givenDate: json['given_date']?.toString(),
        notes: parseString(json['notes']),
      );
}

class GrowthRecord {
  final int id;
  final String dateRecorded;
  final double? weightKg;
  final double? heightCm;
  final double? headCircumferenceCm;
  final String notes;

  GrowthRecord({
    required this.id,
    required this.dateRecorded,
    this.weightKg,
    this.heightCm,
    this.headCircumferenceCm,
    required this.notes,
  });

  factory GrowthRecord.fromJson(Map<String, dynamic> json) => GrowthRecord(
        id: parseIntOr(json['id']),
        dateRecorded: parseString(json['date_recorded']),
        // DRF's `DecimalField` serialises as a string, so a strict
        // `as num?` cast would throw and prevent the child profile
        // list from rendering. `parseDouble` accepts both shapes.
        weightKg: parseDouble(json['weight_kg']),
        heightCm: parseDouble(json['height_cm']),
        headCircumferenceCm: parseDouble(json['head_circumference_cm']),
        notes: parseString(json['notes']),
      );
}

class ChildClinicVisit {
  final int id;
  final String visitDate;
  final String feverIllnessHistory;
  final String nutritionStatus;
  final String developmentMilestones;
  final String doctorRecommendations;
  final String? nextVisitDate;

  ChildClinicVisit({
    required this.id,
    required this.visitDate,
    required this.feverIllnessHistory,
    required this.nutritionStatus,
    required this.developmentMilestones,
    required this.doctorRecommendations,
    this.nextVisitDate,
  });

  factory ChildClinicVisit.fromJson(Map<String, dynamic> json) =>
      ChildClinicVisit(
        id: parseIntOr(json['id']),
        visitDate: parseString(json['visit_date']),
        feverIllnessHistory: parseString(json['fever_illness_history']),
        nutritionStatus: parseString(json['nutrition_status']),
        developmentMilestones: parseString(json['development_milestones']),
        doctorRecommendations: parseString(json['doctor_recommendations']),
        nextVisitDate: json['next_visit_date']?.toString(),
      );
}

class ChildProfile {
  final int id;
  final String firstName;
  final String lastName;
  final String gender;
  final String dateOfBirth;
  final double? birthWeightKg;
  final String? birthCertificateNumber;
  final List<VaccinationRecord> vaccinations;
  final List<GrowthRecord> growthRecords;
  final List<ChildClinicVisit> clinicVisits;

  ChildProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.dateOfBirth,
    this.birthWeightKg,
    this.birthCertificateNumber,
    required this.vaccinations,
    required this.growthRecords,
    required this.clinicVisits,
  });

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? 'Baby' : name;
  }

  factory ChildProfile.fromJson(Map<String, dynamic> json) => ChildProfile(
        id: parseIntOr(json['id']),
        firstName: parseString(json['first_name']),
        lastName: parseString(json['last_name']),
        gender: parseString(json['gender'], fallback: 'UNKNOWN'),
        dateOfBirth: parseString(json['date_of_birth']),
        // `birth_weight_kg` is a `DecimalField` on the backend and is
        // serialised as a string (e.g. "3.50"). A direct `as num?`
        // cast on a string throws `TypeError` and aborts the whole
        // `fromJson`, which made the entire child profile screen
        // appear "stuck loading". Use the safe `parseDouble` helper.
        birthWeightKg: parseDouble(json['birth_weight_kg']),
        birthCertificateNumber: json['birth_certificate_number']?.toString(),
        vaccinations: ((json['vaccinations'] as List?) ?? [])
            .map((e) => VaccinationRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
        growthRecords: ((json['growth_records'] as List?) ?? [])
            .map((e) => GrowthRecord.fromJson(e as Map<String, dynamic>))
            .toList(),
        clinicVisits: ((json['clinic_visits'] as List?) ?? [])
            .map((e) => ChildClinicVisit.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
