import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/mother_dashboard.dart';
import '../../widgets/common_widgets.dart';

class SymptomsScreen extends StatefulWidget {
  const SymptomsScreen({super.key});

  @override
  State<SymptomsScreen> createState() => _SymptomsScreenState();
}

class _SymptomsScreenState extends State<SymptomsScreen> {
  late Future<List<SymptomReport>> _future;

  final _symptoms = const [
    _Symptom('bleeding', 'Vaginal bleeding / spotting', Icons.water_drop_outlined),
    _Symptom('headache', 'Severe headache', Icons.psychology_outlined),
    _Symptom('vision_changes', 'Vision changes', Icons.visibility_outlined),
    _Symptom('abdominal_pain', 'Severe abdominal pain', Icons.flash_on_outlined),
    _Symptom('swelling', 'Sudden swelling', Icons.waves_outlined),
    _Symptom('fever', 'High fever or chills', Icons.thermostat_outlined),
    _Symptom('reduced_movement', 'Reduced fetal movement', Icons.child_care_outlined),
  ];

  final Set<String> _selected = {};
  String _severity = 'LOW';
  final _descCtrl = TextEditingController();
  bool _submitting = false;
  String? _submitMessage;

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().listSymptoms();
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    setState(() {
      _future = context.read<MotherApi>().listSymptoms();
    });
  }

  Future<void> _submit() async {
    if (_selected.isEmpty && _descCtrl.text.trim().isEmpty) {
      setState(() => _submitMessage =
          'Please select a symptom or describe how you feel.');
      return;
    }
    setState(() {
      _submitting = true;
      _submitMessage = null;
    });
    try {
      final labels = _selected
          .map((id) => _symptoms
              .firstWhere((s) => s.id == id,
                  orElse: () => const _Symptom('', '', Icons.help))
              .label)
          .where((s) => s.isNotEmpty)
          .join(', ');
      await context.read<MotherApi>().reportSymptoms(
            symptoms: labels,
            description: _descCtrl.text.trim(),
            severity: _severity,
          );
      setState(() {
        _submitMessage = 'Symptom report submitted and sent to your clinical team.';
        _selected.clear();
        _descCtrl.clear();
        _severity = 'LOW';
      });
      _reload();
    } catch (e) {
      setState(() =>
          _submitMessage = 'Failed to submit. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Health Monitoring'),
        backgroundColor: AppColors.bgCard,
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<SymptomReport>>(
          future: _future,
          builder: (context, snap) {
            final reports = snap.data ?? const [];
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: [
                HeroBanner(
                  title: 'Health Monitoring',
                  subtitle: 'Report any symptoms for immediate care',
                  icon: Icons.health_and_safety_outlined,
                  tintStart: AppColors.primary,
                  tintEnd: AppColors.pink,
                  iconColor: AppColors.primary,
                  badges: const [
                    StatusBadge(
                      label: 'Monitoring Active',
                      color: AppColors.success,
                      icon: Icons.circle,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.add_circle_outline,
                              color: AppColors.primary, size: 20),
                          const SizedBox(width: 6),
                          const Text(
                            'Report Symptoms',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _symptoms.map((s) {
                          final selected = _selected.contains(s.id);
                          return InkWell(
                            onTap: () => setState(() {
                              selected
                                  ? _selected.remove(s.id)
                                  : _selected.add(s.id);
                            }),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 10),
                              decoration: BoxDecoration(
                                color: selected
                                    ? AppColors.primaryTint
                                    : AppColors.bgInput,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: selected
                                      ? AppColors.primary
                                      : AppColors.borderLight,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(s.icon,
                                      size: 16,
                                      color: selected
                                          ? AppColors.primary
                                          : AppColors.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    s.label,
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: selected
                                          ? AppColors.primary
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'How Severe Is This?',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Your report will be sent to the clinical team for review in the admin/doctor workflow.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: ['LOW', 'MEDIUM', 'HIGH'].map((sev) {
                          final selected = _severity == sev;
                          final color = sev == 'HIGH'
                              ? AppColors.danger
                              : sev == 'MEDIUM'
                                  ? AppColors.warning
                                  : AppColors.success;
                          return Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.only(right: 8),
                              child: InkWell(
                                onTap: () =>
                                    setState(() => _severity = sev),
                                borderRadius: BorderRadius.circular(14),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 12),
                                  decoration: BoxDecoration(
                                    color: selected
                                        ? color.withValues(alpha: 0.10)
                                        : AppColors.bgInput,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: selected
                                          ? color
                                          : AppColors.borderLight,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      sev,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        color: selected
                                            ? color
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _descCtrl,
                        maxLines: 4,
                        decoration: const InputDecoration(
                          labelText: 'Additional Details',
                          hintText:
                              'Describe when symptoms started, how long, and other details…',
                          alignLabelWithHint: true,
                        ),
                      ),
                      if (_submitMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _submitMessage!,
                          style: TextStyle(
                            color: _submitMessage!.contains('submitted')
                                ? AppColors.success
                                : AppColors.danger,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _submitting ? null : _submit,
                        icon: _submitting
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.send),
                        label: Text(
                          _submitting
                              ? 'Submitting…'
                              : 'Report Symptoms Now',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.history,
                              color: AppColors.primary, size: 20),
                          SizedBox(width: 6),
                          Text(
                            'Recent Reports',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (reports.isEmpty)
                        const EmptyView(
                          message: 'No reports submitted yet',
                          icon: Icons.history_toggle_off,
                        )
                      else
                        ...reports.take(10).map(
                              (r) => _ReportTile(report: r),
                            ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Symptom {
  final String id;
  final String label;
  final IconData icon;
  const _Symptom(this.id, this.label, this.icon);
}

class _ReportTile extends StatelessWidget {
  final SymptomReport report;
  const _ReportTile({required this.report});

  Color _sevColor(String s) {
    switch (s) {
      case 'HIGH':
        return AppColors.danger;
      case 'MEDIUM':
        return AppColors.warning;
      default:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _sevColor(report.severity);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgInput,
        borderRadius: BorderRadius.circular(14),
        border: Border(
          left: BorderSide(color: color, width: 4),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusBadge(label: report.severity, color: color),
              const Spacer(),
              Text(
                timeAgo(report.reportedAt),
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            report.symptoms.isEmpty
                ? 'Custom report'
                : report.symptoms,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: AppColors.textPrimary,
            ),
          ),
          if (report.description.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              report.description,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                Icons.circle,
                size: 8,
                color: report.status == 'PENDING'
                    ? AppColors.warning
                    : AppColors.success,
              ),
              const SizedBox(width: 4),
              Text(
                report.status,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: report.status == 'PENDING'
                      ? AppColors.warning
                      : AppColors.success,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}