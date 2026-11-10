// Regression test for the child profile "stuck loading" bug.
//
// Previously `ChildProfile.fromJson` used `(json['birth_weight_kg']
// as num?)?.toDouble()`. The Django REST Framework serializer returns
// `DecimalField` values as **strings** (e.g. `"3.50"`), so that cast
// threw `TypeError: 'String' is not a subtype of 'num'` for any child
// record that had a birth weight. The exception bubbled up to the
// `FutureBuilder`, leaving the screen in a perpetual loading state.
//
// These tests ensure the model now accepts both the string and the
// numeric shapes that the backend can produce, and that a fully
// populated record parses without throwing.

import 'package:flutter_test/flutter_test.dart';
import 'package:mother_app/models/child_profile.dart';
import 'package:mother_app/core/utils/json_utils.dart';

void main() {
  group('json_utils helpers', () {
    test('parseDouble accepts num, string and null', () {
      expect(parseDouble(3.5), 3.5);
      expect(parseDouble(3), 3.0);
      expect(parseDouble('3.50'), 3.5);
      expect(parseDouble('0'), 0.0);
      expect(parseDouble(null), isNull);
      expect(parseDouble(''), isNull);
      expect(parseDouble('not a number'), isNull);
    });

    test('parseInt accepts num, string and null', () {
      expect(parseInt(3), 3);
      expect(parseInt(3.7), 3); // truncates like Dart's toInt
      expect(parseInt('5'), 5);
      expect(parseInt('5.0'), 5); // "3.0" → 3
      expect(parseInt(null), isNull);
      expect(parseInt(''), isNull);
    });

    test('parseString coerces values safely', () {
      expect(parseString('hello'), 'hello');
      expect(parseString(42), '42');
      expect(parseString(null), '');
      expect(parseString(''), '');
    });

    test('humanizeEnum handles empty / null safely', () {
      expect(humanizeEnum('MALE'), 'Male');
      expect(humanizeEnum(null), '—');
      expect(humanizeEnum(''), '—');
    });
  });

  group('ChildProfile.fromJson', () {
    test('parses a child with decimal-as-string (real backend shape)', () {
      // This is what `ChildProfileDetailSerializer` actually returns
      // from Django REST Framework. `birth_weight_kg` comes back as a
      // string because `DecimalField` defaults to `coerce_to_string`.
      final json = {
        'id': 1,
        'first_name': 'Aisha',
        'last_name': 'Otieno',
        'gender': 'FEMALE',
        'date_of_birth': '2025-12-01',
        'birth_weight_kg': '3.25', // <-- string, not num
        'birth_certificate_number': null,
        'vaccinations': [
          {
            'id': 10,
            'vaccine_name': 'BCG',
            'vaccine_name_display': 'BCG',
            'status': 'GIVEN',
            'expected_date': '2025-12-01',
            'given_date': '2025-12-01',
            'notes': '',
          }
        ],
        'growth_records': [
          {
            'id': 20,
            'date_recorded': '2026-01-15',
            'weight_kg': '4.10', // <-- string
            'height_cm': '52.0', // <-- string
            'head_circumference_cm': '36.0', // <-- string
            'notes': '',
          }
        ],
        'clinic_visits': [],
      };

      // Must NOT throw. This is the regression assertion.
      final child = ChildProfile.fromJson(json);

      expect(child.id, 1);
      expect(child.displayName, 'Aisha Otieno');
      expect(child.gender, 'FEMALE');
      expect(child.birthWeightKg, 3.25);
      expect(child.vaccinations, hasLength(1));
      expect(child.vaccinations.first.vaccineName, 'BCG');
      expect(child.growthRecords, hasLength(1));
      expect(child.growthRecords.first.weightKg, 4.1);
      expect(child.growthRecords.first.heightCm, 52.0);
    });

    test('parses a child with decimal-as-num (older / future shape)', () {
      final json = {
        'id': 2,
        'first_name': 'Brian',
        'last_name': '',
        'gender': 'MALE',
        'date_of_birth': '2024-06-10',
        'birth_weight_kg': 4.0, // <-- num
        'birth_certificate_number': 'BC-1234',
        'vaccinations': [],
        'growth_records': [],
        'clinic_visits': [],
      };

      final child = ChildProfile.fromJson(json);

      expect(child.id, 2);
      expect(child.displayName, 'Brian');
      expect(child.birthWeightKg, 4.0);
      expect(child.birthCertificateNumber, 'BC-1234');
    });

    test('parses a child with missing / null decimals', () {
      final json = {
        'id': 3,
        'first_name': 'Caleb',
        'last_name': 'Wanjiru',
        'gender': 'UNKNOWN',
        'date_of_birth': '2025-03-20',
        'birth_weight_kg': null,
        'vaccinations': [],
        'growth_records': [],
        'clinic_visits': [],
      };

      final child = ChildProfile.fromJson(json);

      expect(child.birthWeightKg, isNull);
      expect(child.displayName, 'Caleb Wanjiru');
    });

    test('missing gender field falls back to UNKNOWN, and the humanizer is safe', () {
      // Regression for the second bug: `c.gender[0] + ...` would throw
      // a RangeError if the gender string were ever empty. The model
      // now defaults missing/empty gender to 'UNKNOWN', and the screen
      // uses `humanizeEnum`, which is safe for either shape.
      final child = ChildProfile.fromJson({
        'id': 4,
        'first_name': 'Dani',
        'last_name': '',
        // No 'gender' key at all.
        'date_of_birth': '2025-01-01',
        'vaccinations': [],
        'growth_records': [],
        'clinic_visits': [],
      });

      expect(child.gender, 'UNKNOWN');
      // The humanizer should produce a presentable value, not crash.
      expect(humanizeEnum(child.gender), 'Unknown');
    });
  });
}
