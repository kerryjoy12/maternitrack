import 'package:flutter/material.dart';

/// MaterniTrack brand colours, kept in sync with the web application's
/// CSS custom properties (frontend/src/index.css).
class AppColors {
  AppColors._();

  // Primary
  static const Color primary = Color(0xFF2563EB);
  static const Color primaryDark = Color(0xFF1D4ED8);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color successDark = Color(0xFF059669);
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerDark = Color(0xFFDC2626);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningDark = Color(0xFFD97706);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color teal = Color(0xFF14B8A6);
  static const Color pink = Color(0xFFEC4899);

  // Backgrounds (light)
  static const Color bgBase = Color(0xFFF6E8FF);
  static const Color bgCard = Color(0xFFFEFEFF);
  static const Color bgInput = Color(0xFFF1F5F9);

  // Text
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textLight = Color(0xFFCBD5E1);

  // Borders
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderLight = Color(0xFFF1F5F9);

  // Soft tints
  static Color primaryTint = primary.withValues(alpha: 0.10);
  static Color primaryTintStrong = primary.withValues(alpha: 0.20);
  static Color successTint = success.withValues(alpha: 0.10);
  static Color dangerTint = danger.withValues(alpha: 0.10);
  static Color warningTint = warning.withValues(alpha: 0.10);
  static Color purpleTint = purple.withValues(alpha: 0.10);
  static Color tealTint = teal.withValues(alpha: 0.10);
  static Color pinkTint = pink.withValues(alpha: 0.10);
}