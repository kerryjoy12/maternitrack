import { useState, useCallback } from 'react';

// ─── Rule types ────────────────────────────────────────────────────────────────

export type ValidationRule<T> =
  | { type: 'required'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; regex: RegExp; message: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'custom'; fn: (val: unknown, form: T) => string | null }
  | { type: 'dateNotFuture'; message?: string }
  | { type: 'dateNotPast'; message?: string }
  | { type: 'dateRange'; minField: keyof T; maxField: keyof T; message?: string };

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T>[];
};

export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

// ─── Built-in patterns ─────────────────────────────────────────────────────────

export const PATTERNS = {
  /** Kenyan mobile: 07XXXXXXXX or +2547XXXXXXXX or 2547XXXXXXXX */
  KENYA_PHONE: /^(\+?254|0)(7|1)\d{8}$/,
  /** Basic email */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Numeric only */
  NUMERIC: /^\d+$/,
  /** Decimal number */
  DECIMAL: /^\d+(\.\d+)?$/,
};

// ─── Validate a single field ───────────────────────────────────────────────────

function validateField<T extends Record<string, unknown>>(
  value: unknown,
  rules: ValidationRule<T>[],
  form: T
): string | null {
  for (const rule of rules) {
    const strVal = String(value ?? '').trim();

    if (rule.type === 'required') {
      if (value === null || value === undefined || strVal === '' || value === false) {
        return rule.message ?? 'This field is required.';
      }
    }

    if (rule.type === 'minLength') {
      if (strVal.length > 0 && strVal.length < rule.value) {
        return rule.message ?? `Must be at least ${rule.value} characters.`;
      }
    }

    if (rule.type === 'maxLength') {
      if (strVal.length > rule.value) {
        return rule.message ?? `Must be at most ${rule.value} characters.`;
      }
    }

    if (rule.type === 'pattern') {
      if (strVal.length > 0 && !rule.regex.test(strVal)) {
        return rule.message;
      }
    }

    if (rule.type === 'min') {
      const num = parseFloat(strVal);
      if (!isNaN(num) && num < rule.value) {
        return rule.message ?? `Must be at least ${rule.value}.`;
      }
    }

    if (rule.type === 'max') {
      const num = parseFloat(strVal);
      if (!isNaN(num) && num > rule.value) {
        return rule.message ?? `Must be at most ${rule.value}.`;
      }
    }

    if (rule.type === 'dateNotFuture') {
      if (strVal) {
        const d = new Date(strVal);
        if (!isNaN(d.getTime()) && d > new Date()) {
          return rule.message ?? 'Date cannot be in the future.';
        }
      }
    }

    if (rule.type === 'dateNotPast') {
      if (strVal) {
        const d = new Date(strVal);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!isNaN(d.getTime()) && d < today) {
          return rule.message ?? 'Date cannot be in the past.';
        }
      }
    }

    if (rule.type === 'custom') {
      const msg = rule.fn(value, form);
      if (msg) return msg;
    }
  }
  return null;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema<T>
) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  /** Validate a single field and update error state */
  const validateOne = useCallback(
    (field: keyof T, value: unknown, form: T): string | null => {
      const rules = schema[field];
      if (!rules) return null;
      const err = validateField(value, rules, form);
      setErrors(prev => ({ ...prev, [field]: err ?? undefined }));
      
      // Mark field as touched immediately if it contains a value (live typing feedback)
      const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
      if (hasValue) {
        setTouched(prev => ({ ...prev, [field]: true }));
      }
      return err;
    },
    [schema]
  );

  /** Validate all fields; returns true if form is valid */
  const validateAll = useCallback(
    (form: T): boolean => {
      const newErrors: ValidationErrors<T> = {};
      let valid = true;
      for (const field of Object.keys(schema) as (keyof T)[]) {
        const rules = schema[field];
        if (!rules) continue;
        const err = validateField(form[field], rules, form);
        if (err) {
          newErrors[field] = err;
          valid = false;
        }
      }
      setErrors(newErrors);
      // Mark all fields as touched on submit attempt
      const allTouched = Object.fromEntries(
        Object.keys(schema).map(k => [k, true])
      ) as Partial<Record<keyof T, boolean>>;
      setTouched(allTouched);
      return valid;
    },
    [schema]
  );

  /** Mark a field as touched (call on blur) */
  const touch = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  /** Clear all errors and touched state */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /** Get error for a field — only show if touched */
  const getError = useCallback(
    (field: keyof T): string | undefined => {
      return touched[field] ? errors[field] : undefined;
    },
    [errors, touched]
  );

  return { errors, touched, validateOne, validateAll, touch, reset, getError };
}

// ─── Pre-built schemas ─────────────────────────────────────────────────────────

/** Schema for Patient registration form */
export type PatientFormFields = {
  full_name: string;
  phone_number: string;
  email?: string;
  national_id?: string;
  nhif_number?: string;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  date_of_birth: string;
  lmp: string;
  clinic_stage: string;
  risk_level: string;
  blood_group: string;
  lang?: string;
  address: string;
  residence_county?: string;
  residence_subcounty?: string;
  residence_ward?: string;
  residence_village?: string;
  emergency_contact_relationship?: string;
  health_facility_name?: string;
  kmhfl_code?: string;
  anc_number?: string;
  pnc_number?: string;
  gravida?: string;
  parity?: string;
  height?: string;
  weight?: string;
  estate_house_number?: string;
  has_diabetes?: boolean;
  has_hypertension?: boolean;
  blood_transfusion_history?: string;
  tb_history?: string;
  has_drug_allergy?: boolean;
  drug_allergies_specify?: string;
  family_history_twins?: boolean;
  family_history_tb?: boolean;
  medical_history?: string;
  surgical_history?: string;
  allergies?: string;
  family_history?: string;
};

export const patientSchema: ValidationSchema<PatientFormFields> = {
  national_id: [
    { type: 'maxLength', value: 20, message: 'National ID cannot exceed 20 characters.' }
  ],
  nhif_number: [
    {
      type: 'pattern',
      regex: /^\d{8,12}$/,
      message: 'NHIF/SHA/SHIF number must be between 8 and 12 digits.',
    }
  ],
  full_name: [
    { type: 'required', message: 'Full name is required.' },
    { type: 'minLength', value: 3, message: 'Name must be at least 3 characters.' },
    { type: 'maxLength', value: 200, message: 'Name is too long.' },
    {
      type: 'pattern',
      regex: /^[a-zA-Z\s'-]+$/,
      message: 'Name can only contain letters, spaces, hyphens and apostrophes.',
    },
  ],
  phone_number: [
    { type: 'required', message: 'Phone number is required.' },
    {
      type: 'pattern',
      regex: PATTERNS.KENYA_PHONE,
      message: 'Enter a valid Kenyan phone number (e.g. 0712345678).',
    },
  ],
  email: [
    {
      type: 'pattern',
      regex: PATTERNS.EMAIL,
      message: 'Enter a valid email address.',
    },
  ],
  next_of_kin_phone: [
    {
      type: 'pattern',
      regex: PATTERNS.KENYA_PHONE,
      message: 'Enter a valid Kenyan phone number.',
    },
  ],
  date_of_birth: [
    { type: 'dateNotFuture', message: 'Date of birth cannot be in the future.' },
    {
      type: 'custom',
      fn: (val) => {
        if (!val) return null;
        const dob = new Date(val as string);
        const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
        if (age < 10) return 'Patient age seems too young (< 10 years).';
        if (age > 70) return 'Please verify the date of birth — age exceeds 70 years.';
        return null;
      },
    },
  ],
  lmp: [
    { type: 'required', message: 'Last Menstrual Period date is required.' },
    { type: 'dateNotFuture', message: 'LMP cannot be in the future.' },
    {
      type: 'custom',
      fn: (val) => {
        if (!val) return null;
        const lmpDate = new Date(val as string);
        const weeksAgo = (Date.now() - lmpDate.getTime()) / (7 * 24 * 3600 * 1000);
        if (weeksAgo > 45) return 'LMP is more than 45 weeks ago — please verify.';
        return null;
      },
    },
  ],
  clinic_stage: [
    { type: 'required', message: 'Clinic stage is required.' },
  ],
  risk_level: [
    { type: 'required', message: 'Risk level is required.' },
  ],
};

/** Schema for Partograph entry form */
export type PartographFormFields = {
  hours_in_labour: string;
  cervical_dilation_cm: string;
  fetal_heart_rate: string;
  contractions_per_10min: string;
  bp_systolic: string;
  bp_diastolic: string;
  pulse_rate: string;
  temperature_celsius: string;
  descent_station: string;
};

export const partographSchema: ValidationSchema<PartographFormFields> = {
  hours_in_labour: [
    { type: 'required', message: 'Hours in labour is required.' },
    { type: 'min', value: 0, message: 'Cannot be negative.' },
    { type: 'max', value: 24, message: 'WHO partograph limit is 24 hours.' },
  ],
  cervical_dilation_cm: [
    { type: 'min', value: 0, message: 'Cannot be negative.' },
    { type: 'max', value: 10, message: 'Maximum cervical dilation is 10 cm.' },
  ],
  fetal_heart_rate: [
    { type: 'min', value: 50, message: 'FHR below 50 bpm is unlikely — please verify.' },
    { type: 'max', value: 220, message: 'FHR above 220 bpm is unlikely — please verify.' },
  ],
  contractions_per_10min: [
    { type: 'min', value: 0 },
    { type: 'max', value: 5, message: 'Maximum 5 contractions per 10 minutes.' },
  ],
  bp_systolic: [
    { type: 'min', value: 60, message: 'Systolic BP seems too low.' },
    { type: 'max', value: 250, message: 'Systolic BP seems too high.' },
  ],
  bp_diastolic: [
    { type: 'min', value: 30, message: 'Diastolic BP seems too low.' },
    { type: 'max', value: 150, message: 'Diastolic BP seems too high.' },
  ],
  pulse_rate: [
    { type: 'min', value: 30, message: 'Pulse rate seems too low.' },
    { type: 'max', value: 200, message: 'Pulse rate seems too high.' },
  ],
  temperature_celsius: [
    { type: 'min', value: 34, message: 'Temperature seems too low.' },
    { type: 'max', value: 42, message: 'Temperature seems too high.' },
  ],
  descent_station: [
    { type: 'min', value: -5, message: 'Station must be -5 to +5.' },
    { type: 'max', value: 5, message: 'Station must be -5 to +5.' },
  ],
};
