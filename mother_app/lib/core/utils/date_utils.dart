import 'package:intl/intl.dart';

/// Helpers used across screens. Mirrors `frontend/src/utils/formatDate`.
String formatDate(String? iso, {String pattern = 'dd MMM yyyy'}) {
  if (iso == null || iso.isEmpty) return '—';
  try {
    final date = DateTime.parse(iso);
    return DateFormat(pattern).format(date);
  } catch (_) {
    return iso;
  }
}

String formatTime(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    final date = DateTime.parse(iso);
    return DateFormat('h:mm a').format(date);
  } catch (_) {
    return iso;
  }
}

/// Formats a date like "25 Wednesday 2026" used in MotherAppointments.
String formatReferenceDate(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  try {
    final date = DateTime.parse(iso);
    final day = date.day.toString().padLeft(2, '0');
    final weekday = DateFormat('EEEE').format(date);
    final year = date.year;
    return '$day $weekday $year';
  } catch (_) {
    return iso;
  }
}

String formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  try {
    final date = DateTime.parse(iso);
    return DateFormat('dd MMM yyyy, h:mm a').format(date);
  } catch (_) {
    return iso;
  }
}

/// "10 minutes ago" style relative time.
String timeAgo(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  try {
    final dt = DateTime.parse(iso).toLocal();
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  } catch (_) {
    return iso;
  }
}