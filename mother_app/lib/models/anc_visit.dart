/// Mirrors the ANCVisit interface used in the MotherJourney / ANC pages.
class AncVisit {
  final int id;
  final int visitNumber;
  final String visitDate;
  final double? weightKg;
  final int? bpSystolic;
  final int? bpDiastolic;
  final int? pulseRate;
  final double? temperatureC;
  final double? fundalHeightCm;
  final int? fetalHeartRate;
  final String fetalPresentation;
  final String fetalPresentationDisplay;
  final String bloodGroupConfirmed;
  final String bloodGroupConfirmedDisplay;
  final double? hemoglobinGdl;
  final String anemiaSeverity;
  final String anemiaSeverityDisplay;
  final double? bloodSugarMgdl;
  final String bloodSugarType;
  final String bloodSugarTypeDisplay;
  final String urineProtein;
  final String urineGlucose;
  final String urineKetones;
  final String hivStatus;
  final String hivStatusDisplay;
  final String syphilisStatus;
  final String syphilisStatusDisplay;
  final String hepatitisBSurfaceAg;
  final String hepatitisBSurfaceAgDisplay;
  final String rubellaIgg;
  final String rubellaIggDisplay;
  final String ultrasoundResults;
  final String complicationsNoted;
  final String medicationPrescribed;
  final String supplementsGiven;
  final String healthEducationGiven;
  final String generalNotes;
  final String remarks;
  final String? nextAppointmentDate;
  final String attendingStaffName;
  final String createdAt;
  final String labResultsSummary;

  AncVisit({
    required this.id,
    required this.visitNumber,
    required this.visitDate,
    this.weightKg,
    this.bpSystolic,
    this.bpDiastolic,
    this.pulseRate,
    this.temperatureC,
    this.fundalHeightCm,
    this.fetalHeartRate,
    required this.fetalPresentation,
    required this.fetalPresentationDisplay,
    required this.bloodGroupConfirmed,
    required this.bloodGroupConfirmedDisplay,
    this.hemoglobinGdl,
    required this.anemiaSeverity,
    required this.anemiaSeverityDisplay,
    this.bloodSugarMgdl,
    required this.bloodSugarType,
    required this.bloodSugarTypeDisplay,
    required this.urineProtein,
    required this.urineGlucose,
    required this.urineKetones,
    required this.hivStatus,
    required this.hivStatusDisplay,
    required this.syphilisStatus,
    required this.syphilisStatusDisplay,
    required this.hepatitisBSurfaceAg,
    required this.hepatitisBSurfaceAgDisplay,
    required this.rubellaIgg,
    required this.rubellaIggDisplay,
    required this.ultrasoundResults,
    required this.complicationsNoted,
    required this.medicationPrescribed,
    required this.supplementsGiven,
    required this.healthEducationGiven,
    required this.generalNotes,
    required this.remarks,
    this.nextAppointmentDate,
    required this.attendingStaffName,
    required this.createdAt,
    required this.labResultsSummary,
  });

  factory AncVisit.fromJson(Map<String, dynamic> json) => AncVisit(
        id: json['id'] as int,
        visitNumber: json['visit_number'] as int? ?? 0,
        visitDate: json['visit_date']?.toString() ?? '',
        weightKg: (json['weight_kg'] as num?)?.toDouble(),
        bpSystolic: json['bp_systolic'] as int?,
        bpDiastolic: json['bp_diastolic'] as int?,
        pulseRate: json['pulse_rate'] as int?,
        temperatureC: (json['temperature_c'] as num?)?.toDouble(),
        fundalHeightCm: (json['fundal_height_cm'] as num?)?.toDouble(),
        fetalHeartRate: json['fetal_heart_rate'] as int?,
        fetalPresentation: json['fetal_presentation']?.toString() ?? '',
        fetalPresentationDisplay:
            json['fetal_presentation_display']?.toString() ?? '',
        bloodGroupConfirmed: json['blood_group_confirmed']?.toString() ?? '',
        bloodGroupConfirmedDisplay:
            json['blood_group_confirmed_display']?.toString() ?? '',
        hemoglobinGdl: (json['hemoglobin_gdl'] as num?)?.toDouble(),
        anemiaSeverity: json['anemia_severity']?.toString() ?? '',
        anemiaSeverityDisplay:
            json['anemia_severity_display']?.toString() ?? '',
        bloodSugarMgdl: (json['blood_sugar_mgdl'] as num?)?.toDouble(),
        bloodSugarType: json['blood_sugar_type']?.toString() ?? '',
        bloodSugarTypeDisplay:
            json['blood_sugar_type_display']?.toString() ?? '',
        urineProtein: json['urine_protein']?.toString() ?? 'NIL',
        urineGlucose: json['urine_glucose']?.toString() ?? 'NIL',
        urineKetones: json['urine_ketones']?.toString() ?? 'NIL',
        hivStatus: json['hiv_status']?.toString() ?? '',
        hivStatusDisplay: json['hiv_status_display']?.toString() ?? '',
        syphilisStatus: json['syphilis_status']?.toString() ?? '',
        syphilisStatusDisplay:
            json['syphilis_status_display']?.toString() ?? '',
        hepatitisBSurfaceAg: json['hepatitis_b_surface_ag']?.toString() ?? '',
        hepatitisBSurfaceAgDisplay:
            json['hepatitis_b_surface_ag_display']?.toString() ?? '',
        rubellaIgg: json['rubella_igg']?.toString() ?? '',
        rubellaIggDisplay: json['rubella_igg_display']?.toString() ?? '',
        ultrasoundResults: json['ultrasound_results']?.toString() ?? '',
        complicationsNoted: json['complications_noted']?.toString() ?? '',
        medicationPrescribed:
            json['medication_prescribed']?.toString() ?? '',
        supplementsGiven: json['supplements_given']?.toString() ?? '',
        healthEducationGiven:
            json['health_education_given']?.toString() ?? '',
        generalNotes: json['general_notes']?.toString() ?? '',
        remarks: json['remarks']?.toString() ?? '',
        nextAppointmentDate: json['next_appointment_date']?.toString(),
        attendingStaffName: json['attending_staff_name']?.toString() ?? '',
        createdAt: json['created_at']?.toString() ?? '',
        labResultsSummary: json['lab_results_summary']?.toString() ?? '',
      );
}