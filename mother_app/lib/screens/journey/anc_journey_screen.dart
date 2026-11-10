import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/anc_visit.dart';
import '../../widgets/common_widgets.dart';

class AncJourneyScreen extends StatefulWidget {
  const AncJourneyScreen({super.key});

  @override
  State<AncJourneyScreen> createState() => _AncJourneyScreenState();
}

class _AncJourneyScreenState extends State<AncJourneyScreen> {
  late Future<List<AncVisit>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().listAncVisits();
  }

  Future<void> _reload() async {
    setState(() {
      _future = context.read<MotherApi>().listAncVisits();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<List<AncVisit>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: const [
                SizedBox(height: 200),
                LoadingView(),
              ],
            );
          }
          if (snap.hasError || snap.data == null) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 100),
                ErrorView(
                  message: 'Could not load ANC visits.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final visits = snap.data!;
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              HeroBanner(
                title: 'My ANC Journey',
                subtitle:
                    'Track your antenatal care visits, lab results, and pregnancy progress',
                icon: Icons.favorite,
                tintStart: AppColors.primary,
                tintEnd: AppColors.teal,
                iconColor: AppColors.primary,
              ),
              const SizedBox(height: 16),
              if (visits.isEmpty)
                AppCard(
                  child: const EmptyView(
                    message:
                        'No ANC visits recorded yet. Your records will appear here after your healthcare provider completes an ANC consultation.',
                    icon: Icons.assignment_outlined,
                  ),
                )
              else
                ...visits.map(
                  (v) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _VisitCard(visit: v),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _VisitCard extends StatefulWidget {
  final AncVisit visit;
  const _VisitCard({required this.visit});

  @override
  State<_VisitCard> createState() => _VisitCardState();
}

class _VisitCardState extends State<_VisitCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final v = widget.visit;
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primaryTint,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.child_care_outlined,
                            color: AppColors.primary, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    'ANC Visit ${v.visitNumber}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const StatusBadge(
                                  label: 'Completed',
                                  color: AppColors.success,
                                  icon: Icons.check_circle_outline,
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.event_outlined,
                                    size: 12, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  formatDate(v.visitDate),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                if (v.attendingStaffName.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  const Icon(Icons.medical_services_outlined,
                                      size: 12, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      v.attendingStaffName,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        _expanded
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (v.hemoglobinGdl != null)
                        _miniStat('Hemoglobin', '${v.hemoglobinGdl} g/dL'),
                      if (v.bpSystolic != null && v.bpDiastolic != null)
                        _miniStat('Blood Pressure',
                            '${v.bpSystolic}/${v.bpDiastolic}'),
                      if (v.bloodSugarMgdl != null)
                        _miniStat(
                            'Blood Sugar', '${v.bloodSugarMgdl} mg/dL'),
                      if (v.weightKg != null)
                        _miniStat('Weight', '${v.weightKg} kg'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (_expanded)
            Container(
              decoration: const BoxDecoration(
                color: AppColors.bgBase,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionHeader(
                      icon: Icons.science_outlined, label: 'Laboratory Results'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      if (v.bloodGroupConfirmedDisplay.isNotEmpty)
                        _labTile('Blood Group',
                            v.bloodGroupConfirmedDisplay),
                      if (v.hemoglobinGdl != null)
                        _labTile('Hemoglobin',
                            '${v.hemoglobinGdl} g/dL\n${v.anemiaSeverityDisplay}'),
                      if (v.bloodSugarMgdl != null)
                        _labTile('Blood Sugar',
                            '${v.bloodSugarMgdl} mg/dL\n${v.bloodSugarTypeDisplay}'),
                      if (v.hivStatusDisplay.isNotEmpty)
                        _labTile('HIV', v.hivStatusDisplay),
                      if (v.syphilisStatusDisplay.isNotEmpty)
                        _labTile('Syphilis', v.syphilisStatusDisplay),
                      if (v.hepatitisBSurfaceAgDisplay.isNotEmpty &&
                          v.hepatitisBSurfaceAg != 'NOT_TESTED')
                        _labTile('Hepatitis B',
                            v.hepatitisBSurfaceAgDisplay),
                      if (v.rubellaIggDisplay.isNotEmpty &&
                          v.rubellaIgg != 'NOT_TESTED')
                        _labTile('Rubella', v.rubellaIggDisplay),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _SectionHeader(
                      icon: Icons.monitor_heart_outlined, label: 'Vital Signs'),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      if (v.weightKg != null)
                        _labTile('Weight', '${v.weightKg} kg'),
                      if (v.bpSystolic != null && v.bpDiastolic != null)
                        _labTile('Blood Pressure',
                            '${v.bpSystolic}/${v.bpDiastolic} mmHg'),
                      if (v.pulseRate != null)
                        _labTile('Pulse', '${v.pulseRate} bpm'),
                      if (v.temperatureC != null)
                        _labTile('Temperature', '${v.temperatureC} °C'),
                    ],
                  ),
                  if (v.medicationPrescribed.isNotEmpty ||
                      v.supplementsGiven.isNotEmpty ||
                      v.complicationsNoted.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionHeader(
                        icon: Icons.medication_outlined,
                        label: 'Clinical Management'),
                    const SizedBox(height: 10),
                    if (v.medicationPrescribed.isNotEmpty)
                      _noteBox('Medications', v.medicationPrescribed),
                    if (v.supplementsGiven.isNotEmpty)
                      _noteBox('Supplements', v.supplementsGiven),
                    if (v.complicationsNoted.isNotEmpty)
                      _noteBox('Complications Noted', v.complicationsNoted,
                          color: AppColors.danger, bg: AppColors.dangerTint),
                  ],
                  if (v.generalNotes.isNotEmpty || v.remarks.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionHeader(
                        icon: Icons.note_alt_outlined, label: 'Notes'),
                    const SizedBox(height: 10),
                    if (v.generalNotes.isNotEmpty)
                      _noteBox('', v.generalNotes),
                    if (v.remarks.isNotEmpty)
                      _noteBox('Remarks', v.remarks),
                  ],
                  if (v.nextAppointmentDate != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.successTint,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: AppColors.success.withValues(alpha: 0.30)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.event_available_outlined,
                              color: AppColors.success, size: 18),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Next Appointment',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                              ),
                              Text(
                                formatDate(v.nextAppointmentDate),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.bgInput,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _labTile(String label, String value) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _noteBox(String label, String text,
      {Color color = AppColors.textPrimary, Color? bg}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg ?? AppColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (label.isNotEmpty)
            Text(
              label.toUpperCase(),
              style: TextStyle(
                fontSize: 10,
                color: color,
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
              ),
            ),
          if (label.isNotEmpty) const SizedBox(height: 4),
          Text(
            text,
            style: TextStyle(fontSize: 12, color: color),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SectionHeader({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}