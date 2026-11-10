import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/child_profile.dart';
import '../../models/mother_dashboard.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common_widgets.dart';
import '../learn/learn_screen.dart';
import '../symptoms/symptoms_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<_DashboardViewModel> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadDashboardData();
  }

  Future<_DashboardViewModel> _loadDashboardData() async {
    final api = context.read<MotherApi>();
    final dashboard = await api.dashboard();
    final children = await api.motherChildren();
    return _DashboardViewModel(dashboard: dashboard, children: children);
  }

  Future<void> _reload() async {
    setState(() {
      _future = _loadDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<_DashboardViewModel>(
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
          if (snap.hasError) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 100),
                ErrorView(
                  message: 'Could not load your dashboard.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final data = snap.data!;
          final dashboard = data.dashboard;
          final firstName = context
              .read<AuthProvider>()
              .user
              ?.fullName
              .split(' ')
              .first ?? '';
          final hour = DateTime.now().hour;
          final greeting = hour < 12
              ? 'Good morning'
              : hour < 17
                  ? 'Good afternoon'
                  : 'Good evening';
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 14, left: 4),
                child: Row(
                  children: [
                    Text(
                      '$greeting, $firstName',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text('🩷', style: TextStyle(fontSize: 20)),
                  ],
                ),
              ),
              HeroBanner(
                title: 'Your Pregnancy Journey',
                subtitle:
                    'Real-time health monitoring and care insights for you and your baby',
                icon: Icons.favorite,
                tintStart: AppColors.primary,
                tintEnd: AppColors.pink,
                iconColor: AppColors.pink,
                badges: [
                  if (dashboard.unreadMessagesCount > 0)
                    StatusBadge(
                      label: '${dashboard.unreadMessagesCount} Unread',
                      color: AppColors.primary,
                      icon: Icons.message_outlined,
                    ),
                  StatusBadge(
                    label: '${dashboard.riskLevel} RISK',
                    color: _riskColor(dashboard.riskLevel),
                    icon: Icons.circle,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _QuickStatsRow(data: dashboard),
              const SizedBox(height: 16),
              _NextAppointmentCard(data: dashboard),
              const SizedBox(height: 16),
              _EmergencyContactsCard(),
              const SizedBox(height: 16),
              _AlertsCard(
                alerts: dashboard.careAlerts,
                onMarkRead: (id) async {
                  try {
                    await context.read<MotherApi>().markCareAlertRead(id);
                    _reload();
                  } catch (_) {}
                },
              ),
              const SizedBox(height: 16),
              _VaccinesCardList(children: data.children),
            ],
          );
        },
      ),
    );
  }

  Color _riskColor(String risk) {
    switch (risk) {
      case 'HIGH':
        return AppColors.danger;
      case 'MEDIUM':
        return AppColors.warning;
      default:
        return AppColors.success;
    }
  }
}

class _DashboardViewModel {
  final MotherDashboardData dashboard;
  final List<ChildProfile> children;

  const _DashboardViewModel({required this.dashboard, required this.children});
}

class _QuickStatsRow extends StatelessWidget {
  final MotherDashboardData data;
  const _QuickStatsRow({required this.data});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _ActionStat(
            label: 'Learn',
            value: 'Pregnancy tips',
            icon: Icons.school_outlined,
            color: AppColors.primary,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const LearnScreen()),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ActionStat(
            label: 'Report Symptoms',
            value: 'Share concerns',
            color: AppColors.pink,
            icon: Icons.monitor_heart_outlined,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SymptomsScreen()),
            ),
          ),
        ),
      ],
    );
  }
}

class _ActionStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  final VoidCallback onTap;

  const _ActionStat({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.bgInput,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Icon(icon, size: 14, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NextAppointmentCard extends StatelessWidget {
  final MotherDashboardData data;
  const _NextAppointmentCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final next = data.nextAppointment;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.event_outlined,
                  size: 16, color: AppColors.textMuted),
              SizedBox(width: 6),
              Text(
                'NEXT APPOINTMENT',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (next == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No upcoming appointments scheduled',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else ...[
            Text(
              next.appointmentType.replaceAll('_', ' '),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${formatDate(next.scheduledDate)} at ${next.scheduledTime ?? 'TBD'}',
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (next.notes.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgInput,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  next.notes,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ],
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.calendar_month_outlined,
                  size: 14, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text(
                'Expected delivery: ${formatDate(data.expectedDeliveryDate)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmergencyContactsCard extends StatelessWidget {
  Future<void> _call(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      border: const Border(
        top: BorderSide(color: AppColors.danger, width: 4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.health_and_safety_outlined,
                  color: AppColors.danger, size: 20),
              SizedBox(width: 6),
              Text(
                'Emergency Contacts',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'If you experience severe bleeding, headaches, vision loss, or high fever, call immediately.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),
          _EmergencyTile(
            label: 'Ambulance Dispatch',
            icon: Icons.local_hospital_outlined,
            color: AppColors.danger,
            tint: AppColors.dangerTint,
            number: '999',
            onTap: () => _call('999'),
          ),
          const SizedBox(height: 8),
          _EmergencyTile(
            label: 'Hospital Hotline',
            icon: Icons.business_outlined,
            color: AppColors.textPrimary,
            tint: AppColors.bgInput,
            number: '+254700000000',
            onTap: () => _call('+254700000000'),
          ),
          const SizedBox(height: 8),
          _EmergencyTile(
            label: 'Maternity Ward',
            icon: Icons.child_friendly_outlined,
            color: AppColors.textPrimary,
            tint: AppColors.bgInput,
            number: '+254711111111',
            onTap: () => _call('+254711111111'),
          ),
        ],
      ),
    );
  }
}

class _EmergencyTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color tint;
  final String number;
  final VoidCallback onTap;
  const _EmergencyTile({
    required this.label,
    required this.icon,
    required this.color,
    required this.tint,
    required this.number,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: tint,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: color,
                    fontSize: 13,
                  ),
                ),
              ),
              Icon(Icons.phone, size: 16, color: color),
            ],
          ),
        ),
      ),
    );
  }
}

class _AlertsCard extends StatelessWidget {
  final List<CareAlert> alerts;
  final Future<void> Function(int) onMarkRead;
  const _AlertsCard({required this.alerts, required this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      border: const Border(
        top: BorderSide(color: AppColors.warning, width: 4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.info_outline, color: AppColors.warning, size: 20),
              SizedBox(width: 6),
              Text(
                'Important Alerts',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (alerts.isEmpty)
            const EmptyView(
              message: 'No messages from your care team at this time',
              icon: Icons.message_outlined,
            )
          else
            ...alerts.map((a) => _AlertTile(alert: a, onMarkRead: onMarkRead)),
        ],
      ),
    );
  }
}

class _AlertTile extends StatelessWidget {
  final CareAlert alert;
  final Future<void> Function(int) onMarkRead;
  const _AlertTile({required this.alert, required this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    final unread = !alert.isRead;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: unread ? AppColors.warningTint : AppColors.bgInput,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: unread
              ? AppColors.warning.withValues(alpha: 0.30)
              : AppColors.borderLight,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.medical_services_outlined,
            color: unread ? AppColors.warning : AppColors.textMuted,
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        alert.senderName ?? 'Care Team',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (unread) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'New',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  alert.message,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatDate(alert.createdAt),
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          if (unread)
            IconButton(
              onPressed: () => onMarkRead(alert.id),
              icon: const Icon(Icons.done_all, size: 18),
              color: AppColors.warning,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
        ],
      ),
    );
  }
}

class _VaccinesCardList extends StatelessWidget {
  final List<ChildProfile> children;
  const _VaccinesCardList({required this.children});

  Color _statusColor(String status) {
    switch (status) {
      case 'GIVEN':
        return AppColors.success;
      case 'MISSED':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  }

  DateTime? _parseDate(String? value) {
    if (value == null || value.isEmpty) return null;
    try {
      return DateTime.parse(value);
    } catch (_) {
      return null;
    }
  }

  String _categoryLabel(DateTime? expectedDate, DateTime? dob) {
    if (expectedDate == null || dob == null) return 'Other';
    final ageInDays = expectedDate.difference(dob).inDays;
    if (ageInDays <= 7) return 'Birth';
    if (ageInDays <= 49) return '6 Weeks';
    if (ageInDays <= 77) return '10 Weeks';
    if (ageInDays <= 105) return '14 Weeks';
    return 'Later';
  }

  String? _reminderLabel(String? expectedDate, String status) {
    if (status == 'GIVEN' || status == 'MISSED' || expectedDate == null || expectedDate.isEmpty) {
      return null;
    }
    final date = _parseDate(expectedDate);
    if (date == null) return null;
    final diff = date.difference(DateTime.now()).inDays;
    if (diff < 0) return 'Overdue';
    if (diff == 0) return 'Due today';
    if (diff == 1) return 'Due tomorrow';
    if (diff == 2) return 'Due in 2 days';
    if (diff == 3) return 'Due in 3 days';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final sections = <String, List<_VaccinationItem>>{};

    for (final child in children) {
      final dob = _parseDate(child.dateOfBirth);
      for (final vaccine in child.vaccinations) {
        final category = _categoryLabel(_parseDate(vaccine.expectedDate), dob);
        sections.putIfAbsent(category, () => []).add(
          _VaccinationItem(
            child: child,
            vaccine: vaccine,
            reminder: _reminderLabel(vaccine.expectedDate, vaccine.status),
          ),
        );
      }
    }

    final orderedSections = ['Birth', '6 Weeks', '10 Weeks', '14 Weeks', 'Later', 'Other']
        .where(sections.containsKey)
        .toList();
    final reminders = sections.values
        .expand((items) => items)
        .where((item) => item.reminder != null)
        .toList();

    return AppCard(
      border: const Border(
        top: BorderSide(color: AppColors.primary, width: 4),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.access_time, color: AppColors.primary, size: 20),
              SizedBox(width: 6),
              Text(
                'Recommended Vaccines',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (children.isEmpty || sections.isEmpty)
            const EmptyView(
              message: 'No vaccination schedule found',
              icon: Icons.vaccines_outlined,
            )
          else ...[
            if (reminders.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.warningTint,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.warning.withValues(alpha: 0.25)),
                ),
                child: Text(
                  'Reminder: ${reminders.length} vaccine${reminders.length == 1 ? '' : 's'} due soon or today.',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
            ...orderedSections.map((section) {
              final items = sections[section]!;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...items.map((item) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.bgInput,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.vaccine.vaccineNameDisplay.isNotEmpty
                                          ? item.vaccine.vaccineNameDisplay
                                          : item.vaccine.vaccineName,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Target Child: ${item.child.displayName}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Expected Date: ${formatDate(item.vaccine.expectedDate)}',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                children: [
                                  StatusBadge(
                                    label: item.vaccine.status.toUpperCase(),
                                    color: _statusColor(item.vaccine.status.toUpperCase()),
                                  ),
                                  if (item.reminder != null) ...[
                                    const SizedBox(height: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryTint,
                                        borderRadius: BorderRadius.circular(999),
                                      ),
                                      child: Text(
                                        item.reminder!,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _VaccinationItem {
  final ChildProfile child;
  final VaccinationRecord vaccine;
  final String? reminder;

  const _VaccinationItem({required this.child, required this.vaccine, this.reminder});
}