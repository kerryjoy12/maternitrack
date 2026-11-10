/// Defensive JSON parsing helpers.
///
/// DRF's `DecimalField` serializes numbers as **strings** by default
/// (e.g. `"3.50"`). When a Flutter model uses `json['x'] as num?` on such a
/// value it throws a `TypeError` and the entire `FutureBuilder` ends up in
/// the error state — which is exactly what made the child profile screen
/// fail to load. These helpers normalise the value so the UI works
/// regardless of whether the backend returned a `num`, a `String`, or
/// `null`.
library;

/// Returns [value] coerced to `double?`. Accepts:
///   * `null`              → `null`
///   * `num` (int/double)  → `value.toDouble()`
///   * `String` (numeric)  → `double.tryParse(value)`
///   * anything else       → `null`
double? parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) {
    if (value.isEmpty) return null;
    return double.tryParse(value);
  }
  return null;
}

/// Returns [value] coerced to `int?`. Accepts:
///   * `null`              → `null`
///   * `num`               → `value.toInt()`
///   * `String` (numeric)  → `int.tryParse(value)`
///   * anything else       → `null`
int? parseInt(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toInt();
  if (value is String) {
    if (value.isEmpty) return null;
    // Handle "3.0" → 3, common when the backend sends a Decimal as a string.
    final asDouble = double.tryParse(value);
    if (asDouble != null) return asDouble.toInt();
    return int.tryParse(value);
  }
  return null;
}

/// Returns [value] coerced to a non-null `int`, falling back to [fallback]
/// (default `0`) when the value is missing or unparseable.
int parseIntOr(dynamic value, {int fallback = 0}) {
  final parsed = parseInt(value);
  return parsed ?? fallback;
}

/// Returns [value] coerced to a non-null `double`, falling back to
/// [fallback] (default `0`) when the value is missing or unparseable.
double parseDoubleOr(dynamic value, {double fallback = 0}) {
  final parsed = parseDouble(value);
  return parsed ?? fallback;
}

/// Safely extracts a string. Returns `''` for null/empty/non-string values.
String parseString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  if (value is String) return value.isEmpty ? fallback : value;
  return value.toString();
}

/// Safely title-cases an enum-style value. `null`, empty, or missing
/// values return [fallback] unchanged — avoiding `RangeError` from
/// `s[0]` on empty strings.
String humanizeEnum(String? value, {String fallback = '—'}) {
  if (value == null || value.isEmpty) return fallback;
  return value[0] + value.substring(1).toLowerCase();
}
