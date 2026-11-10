import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../core/utils/json_utils.dart';
import '../../models/child_profile.dart';
import '../../widgets/common_widgets.dart';

// ─── List screen ─────────────────────────────────────────────────────────────

class ChildProfileScreen extends StatefulWidget {
  const ChildProfileScreen({super.key});

  @override
  State<ChildProfileScreen> createState() => _ChildProfileScreenState();
}

class _ChildProfileScreenState extends State<ChildProfileScreen> {
  late Future<List<ChildProfile>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<ChildProfile>> _load() {
    return context.read<MotherApi>().motherChildren();
  }

  Future<void> _reload() async {
    setState(() {
      _future = _load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<List<ChildProfile>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [SizedBox(height: 200), LoadingView()],
            );
          }
          if (snap.hasError) {
            // Log the underlying error in debug mode so we can see the
            // root cause (e.g. a `TypeError` from a serializer mismatch)
            // even though the UI only displays a friendly message.
            if (kDebugMode) {
              debugPrint('ChildProfileScreen load error: ${snap.error}');
            }
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 100),
                ErrorView(
                  message: 'Could not load child profiles.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final children = snap.data ?? const <ChildProfile>[];
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              HeroBanner(
                title: 'Child Profiles',
                subtitle: 'Tap a child to view their full health record',
                icon: Icons.child_care,
                tintStart: AppColors.teal,
                tintEnd: AppColors.primary,
                iconColor: AppColors.teal,
              ),
              const SizedBox(height: 16),
              if (children.isEmpty)
                AppCard(
                  child: const EmptyView(
                    message:
                        'No child profiles found yet. Baby records will appear here after delivery is recorded by your healthcare provider.',
                    icon: Icons.child_friendly_outlined,
                  ),
                )
              else
                ...children.map((child) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ChildListTile(child: child),
                    )),
            ],
          );
        },
      ),
    );
  }
}

// ─── List tile ────────────────────────────────────────────────────────────────

class _ChildListTile extends StatelessWidget {
  final ChildProfile child;
  const _ChildListTile({required this.child});

  @override
  Widget build(BuildContext context) {
    final c = child;
    final genderColor = c.gender == 'MALE'
        ? AppColors.primary
        : c.gender == 'FEMALE'
            ? AppColors.purple
            : AppColors.teal;
    final genderIcon = c.gender == 'MALE'
        ? Icons.boy_outlined
        : c.gender == 'FEMALE'
            ? Icons.girl_outlined
            : Icons.child_care_outlined;

    return AppCard(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ChildDetailScreen(child: c)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: genderColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(genderIcon, color: genderColor, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c.displayName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.cake_outlined, size: 12, color: AppColors.textMuted),
                    const SizedBox(width: 4),
                    Text(formatDate(c.dateOfBirth),
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    if (c.birthWeightKg != null) ...[
                      const SizedBox(width: 8),
                      Text('· ${c.birthWeightKg} kg',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _countChip(Icons.vaccines_outlined, '${c.vaccinations.length} vaccines'),
                    const SizedBox(width: 8),
                    _countChip(Icons.show_chart_outlined, '${c.growthRecords.length} growth'),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ],
      ),
    );
  }

  Widget _countChip(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 11, color: AppColors.textMuted),
        const SizedBox(width: 3),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
      ],
    );
  }
}

// ─── Detail screen ────────────────────────────────────────────────────────────

class ChildDetailScreen extends StatelessWidget {
  final ChildProfile child;
  const ChildDetailScreen({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = child;
    final genderColor = c.gender == 'MALE'
        ? AppColors.primary
        : c.gender == 'FEMALE'
            ? AppColors.purple
            : AppColors.teal;
    final genderIcon = c.gender == 'MALE'
        ? Icons.boy_outlined
        : c.gender == 'FEMALE'
            ? Icons.girl_outlined
            : Icons.child_care_outlined;

    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: Text(c.displayName),
        backgroundColor: AppColors.bgCard,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          // Header card
          AppCard(
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: genderColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(genderIcon, color: genderColor, size: 36),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        c.displayName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      _infoRow(Icons.cake_outlined, 'Date of Birth', formatDate(c.dateOfBirth)),
                      if (c.birthWeightKg != null)
                        _infoRow(Icons.monitor_weight_outlined, 'Birth Weight', '${c.birthWeightKg} kg'),
                      if (c.birthCertificateNumber != null && c.birthCertificateNumber!.isNotEmpty)
                        _infoRow(Icons.badge_outlined, 'Birth Certificate', c.birthCertificateNumber!),
                      // Use a defensive humanizer so we never call `s[0]`
                      // on an empty / null value, which would throw
                      // `RangeError` and crash the detail screen.
                      _infoRow(
                        Icons.wc_outlined,
                        'Gender',
                        humanizeEnum(c.gender.isEmpty ? null : c.gender),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Vaccinations
          _SectionCard(
            icon: Icons.vaccines_outlined,
            title: 'Vaccinations',
            child: c.vaccinations.isEmpty
                ? const _EmptySection(message: 'No vaccination records yet.')
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: c.vaccinations.map((v) => _VaccineBadge(v: v)).toList(),
                  ),
          ),
          const SizedBox(height: 12),

          // Growth Records
          _SectionCard(
            icon: Icons.show_chart_outlined,
            title: 'Growth Records',
            child: c.growthRecords.isEmpty
                ? const _EmptySection(message: 'No growth records yet.')
                : Column(
                    children: c.growthRecords.map((g) => _GrowthRow(g: g)).toList(),
                  ),
          ),
          const SizedBox(height: 12),

          // Clinic Visits
          _SectionCard(
            icon: Icons.local_hospital_outlined,
            title: 'Clinic Visits',
            child: c.clinicVisits.isEmpty
                ? const _EmptySection(message: 'No clinic visits recorded yet.')
                : Column(
                    children: c.clinicVisits.map((v) => _ClinicVisitTile(v: v)).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 3),
      child: Row(
        children: [
          Icon(icon, size: 12, color: AppColors.textMuted),
          const SizedBox(width: 5),
          Text('$label: ', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          Flexible(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _SectionCard({required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _EmptySection extends StatelessWidget {
  final String message;
  const _EmptySection({required this.message});

  @override
  Widget build(BuildContext context) {
    return Text(message, style: const TextStyle(fontSize: 12, color: AppColors.textMuted));
  }
}

// ─── Vaccine badge ────────────────────────────────────────────────────────────

class _VaccineBadge extends StatelessWidget {
  final VaccinationRecord v;
  const _VaccineBadge({required this.v});

  @override
  Widget build(BuildContext context) {
    final color = v.status == 'GIVEN'
        ? AppColors.success
        : v.status == 'MISSED'
            ? AppColors.danger
            : AppColors.textMuted;
    final bg = v.status == 'GIVEN'
        ? AppColors.successTint
        : v.status == 'MISSED'
            ? AppColors.dangerTint
            : AppColors.bgInput;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            v.status == 'GIVEN' ? Icons.check_circle_outline : Icons.radio_button_unchecked,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(v.vaccineNameDisplay,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

// ─── Growth row ───────────────────────────────────────────────────────────────

class _GrowthRow extends StatelessWidget {
  final GrowthRecord g;
  const _GrowthRow({required this.g});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgBase,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          const Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(formatDate(g.dateRecorded),
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
          const Spacer(),
          if (g.weightKg != null) _stat('${g.weightKg} kg'),
          if (g.heightCm != null) _stat('${g.heightCm} cm'),
          if (g.headCircumferenceCm != null) _stat('HC ${g.headCircumferenceCm} cm'),
        ],
      ),
    );
  }

  Widget _stat(String text) => Padding(
        padding: const EdgeInsets.only(left: 10),
        child: Text(text,
            style: const TextStyle(
                fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
      );
}

// ─── Clinic visit tile ────────────────────────────────────────────────────────

class _ClinicVisitTile extends StatelessWidget {
  final ChildClinicVisit v;
  const _ClinicVisitTile({required this.v});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgBase,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.event_outlined, size: 12, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Text(formatDate(v.visitDate),
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            ],
          ),
          if (v.developmentMilestones.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('Milestones: ${v.developmentMilestones}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
          if (v.nutritionStatus.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('Nutrition: ${v.nutritionStatus}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
          if (v.doctorRecommendations.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('Recommendations: ${v.doctorRecommendations}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
          if (v.nextVisitDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.event_available_outlined, size: 12, color: AppColors.success),
                const SizedBox(width: 4),
                Text('Next visit: ${formatDate(v.nextVisitDate)}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w700)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
