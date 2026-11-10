/// Mother / patient profile, mirrors `Patient` from frontend types.
class Patient {
  final int id;
  final String patientNumber;
  final String fullName;
  final String phoneNumber;
  final String? email;
  final String? nationalId;
  final String? nhifNumber;
  final String nextOfKinName;
  final String nextOfKinPhone;
  final String? dateOfBirth;
  final String lmp;
  final String edd;
  final String clinicStage;
  final String riskLevel;
  final String bloodGroup;
  final String language;
  final String gender;
  final String maritalStatus;
  final String educationLevel;
  final String occupation;
  final String spouseName;
  final String spousePhone;
  final String medicalHistory;
  final String surgicalHistory;
  final String allergies;
  final String familyHistory;
  final String address;
  final String residenceCounty;
  final String residenceSubcounty;
  final String residenceWard;
  final String residenceVillage;
  final String emergencyContactRelationship;
  final String emergencyContactAddress;
  final String healthFacilityName;
  final String kmhflCode;
  final String ancNumber;
  final String pncNumber;
  final int? gravida;
  final int? parity;
  final double? height;
  final double? weight;
  final String estateHouseNumber;
  final bool hasDiabetes;
  final bool hasHypertension;
  final String bloodTransfusionHistory;
  final String tbHistory;
  final bool hasDrugAllergy;
  final String drugAllergiesSpecify;
  final bool familyHistoryTwins;
  final bool familyHistoryTb;
  final String notes;
  final bool isActive;
  final int? registeredBy;
  final String? registeredByName;
  final String createdAt;
  final String updatedAt;
  final int? age;
  final int? weeksPregnant;
  final int? daysToEdd;
  final bool isOverdue;
  final bool isDueSoon;

  Patient({
    required this.id,
    required this.patientNumber,
    required this.fullName,
    required this.phoneNumber,
    this.email,
    this.nationalId,
    this.nhifNumber,
    required this.nextOfKinName,
    required this.nextOfKinPhone,
    this.dateOfBirth,
    required this.lmp,
    required this.edd,
    required this.clinicStage,
    required this.riskLevel,
    required this.bloodGroup,
    required this.language,
    required this.gender,
    required this.maritalStatus,
    required this.educationLevel,
    required this.occupation,
    required this.spouseName,
    required this.spousePhone,
    required this.medicalHistory,
    required this.surgicalHistory,
    required this.allergies,
    required this.familyHistory,
    required this.address,
    required this.residenceCounty,
    required this.residenceSubcounty,
    required this.residenceWard,
    required this.residenceVillage,
    required this.emergencyContactRelationship,
    required this.emergencyContactAddress,
    required this.healthFacilityName,
    required this.kmhflCode,
    required this.ancNumber,
    required this.pncNumber,
    this.gravida,
    this.parity,
    this.height,
    this.weight,
    required this.estateHouseNumber,
    required this.hasDiabetes,
    required this.hasHypertension,
    required this.bloodTransfusionHistory,
    required this.tbHistory,
    required this.hasDrugAllergy,
    required this.drugAllergiesSpecify,
    required this.familyHistoryTwins,
    required this.familyHistoryTb,
    required this.notes,
    required this.isActive,
    this.registeredBy,
    this.registeredByName,
    required this.createdAt,
    required this.updatedAt,
    this.age,
    this.weeksPregnant,
    this.daysToEdd,
    required this.isOverdue,
    required this.isDueSoon,
  });

  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
        id: json['id'] as int,
        patientNumber: json['patient_number']?.toString() ?? '',
        fullName: json['full_name']?.toString() ?? '',
        phoneNumber: json['phone_number']?.toString() ?? '',
        email: json['email'] as String?,
        nationalId: json['national_id']?.toString(),
        nhifNumber: json['nhif_number']?.toString(),
        nextOfKinName: json['next_of_kin_name']?.toString() ?? '',
        nextOfKinPhone: json['next_of_kin_phone']?.toString() ?? '',
        dateOfBirth: json['date_of_birth']?.toString(),
        lmp: json['lmp']?.toString() ?? '',
        edd: json['edd']?.toString() ?? '',
        clinicStage: json['clinic_stage']?.toString() ?? 'ANC1',
        riskLevel: json['risk_level']?.toString() ?? 'LOW',
        bloodGroup: json['blood_group']?.toString() ?? '',
        language: json['lang']?.toString() ?? 'en',
        gender: json['gender']?.toString() ?? 'FEMALE',
        maritalStatus: json['marital_status']?.toString() ?? '',
        educationLevel: json['education_level']?.toString() ?? '',
        occupation: json['occupation']?.toString() ?? '',
        spouseName: json['spouse_name']?.toString() ?? '',
        spousePhone: json['spouse_phone']?.toString() ?? '',
        medicalHistory: json['medical_history']?.toString() ?? '',
        surgicalHistory: json['surgical_history']?.toString() ?? '',
        allergies: json['allergies']?.toString() ?? '',
        familyHistory: json['family_history']?.toString() ?? '',
        address: json['address']?.toString() ?? '',
        residenceCounty: json['residence_county']?.toString() ?? '',
        residenceSubcounty: json['residence_subcounty']?.toString() ?? '',
        residenceWard: json['residence_ward']?.toString() ?? '',
        residenceVillage: json['residence_village']?.toString() ?? '',
        emergencyContactRelationship:
            json['emergency_contact_relationship']?.toString() ?? '',
        emergencyContactAddress:
            json['emergency_contact_address']?.toString() ?? '',
        healthFacilityName: json['health_facility_name']?.toString() ?? '',
        kmhflCode: json['kmhfl_code']?.toString() ?? '',
        ancNumber: json['anc_number']?.toString() ?? '',
        pncNumber: json['pnc_number']?.toString() ?? '',
        gravida: json['gravida'] as int?,
        parity: json['parity'] as int?,
        height: (json['height'] as num?)?.toDouble(),
        weight: (json['weight'] as num?)?.toDouble(),
        estateHouseNumber: json['estate_house_number']?.toString() ?? '',
        hasDiabetes: json['has_diabetes'] as bool? ?? false,
        hasHypertension: json['has_hypertension'] as bool? ?? false,
        bloodTransfusionHistory:
            json['blood_transfusion_history']?.toString() ?? '',
        tbHistory: json['tb_history']?.toString() ?? '',
        hasDrugAllergy: json['has_drug_allergy'] as bool? ?? false,
        drugAllergiesSpecify: json['drug_allergies_specify']?.toString() ?? '',
        familyHistoryTwins: json['family_history_twins'] as bool? ?? false,
        familyHistoryTb: json['family_history_tb'] as bool? ?? false,
        notes: json['notes']?.toString() ?? '',
        isActive: json['is_active'] as bool? ?? true,
        registeredBy: json['registered_by'] as int?,
        registeredByName: json['registered_by_name']?.toString(),
        createdAt: json['created_at']?.toString() ?? '',
        updatedAt: json['updated_at']?.toString() ?? '',
        age: json['age'] as int?,
        weeksPregnant: json['weeks_pregnant'] as int?,
        daysToEdd: json['days_to_edd'] as int?,
        isOverdue: json['is_overdue'] as bool? ?? false,
        isDueSoon: json['is_due_soon'] as bool? ?? false,
      );
}