import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/mother_dashboard.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common_widgets.dart';
import 'edit_profile_screen.dart';
import 'settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  final ValueChanged<int> onTabChange;
  const ProfileScreen({super.key, required this.onTabChange});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<MotherMedicalRecordsData> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().medicalRecords();
  }

  Future<void> _reload() async {
    setState(() {
      _future = context.read<MotherApi>().medicalRecords();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<MotherMedicalRecordsData>(
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
                  message: 'Could not load your profile.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final data = snap.data!;
          final demographics =
              data.demographicsAndHistory as Map<String, dynamic>?;
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _ProfileHeader(
                fullName: demographics?['full_name']?.toString() ??
                    user?.fullName ??
                    'Mother',
                email: demographics?['email']?.toString() ??
                    user?.email ??
                    '',
                phone: demographics?['phone_number']?.toString() ??
                    user?.phoneNumber ??
                    '',
              ),
              const SizedBox(height: 16),
              if (demographics != null)
                _PatientInfoCard(demographics: demographics),
              const SizedBox(height: 16),
              _MenuCard(
                onTabChange: widget.onTabChange,
                onEdit: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const EditProfileScreen(),
                    ),
                  );
                  _reload();
                },
              ),
              const SizedBox(height: 16),
              _ClinicalNotesSection(notes: data.clinicalNotes),
              const SizedBox(height: 16),
              _DocumentsSection(documents: data.uploadedDocuments),
            ],
          );
        },
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final String fullName;
  final String email;
  final String phone;
  const _ProfileHeader({
    required this.fullName,
    required this.email,
    required this.phone,
  });

  @override
  Widget build(BuildContext context) {
    final initials = fullName
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0].toUpperCase())
        .join();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.98),
            AppColors.pink.withValues(alpha: 0.95),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.16),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.35), width: 2),
            ),
            child: Center(
              child: Text(
                initials.isEmpty ? 'M' : initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 24,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text(
                  fullName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                if (email.isNotEmpty)
                  Text(
                    email,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
                if (phone.isNotEmpty)
                  Text(
                    phone,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.white70,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PatientInfoCard extends StatelessWidget {
  final Map<String, dynamic> demographics;
  const _PatientInfoCard({required this.demographics});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primaryTint,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.person_outline, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Patient Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'A calm, elegant view of your care details',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge(
                label: 'Care overview',
                color: AppColors.primary,
                icon: Icons.favorite_outline,
              ),
            ],
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              // compute two columns with spacing
              final spacing = 12.0;
              final tileWidth = (constraints.maxWidth - spacing) / 2;
              return Wrap(
                spacing: spacing,
                runSpacing: 12,
                children: [
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Patient Number',
                      value: demographics['patient_number']?.toString() ?? '—',
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Blood Group',
                      value: demographics['blood_group']?.toString() ?? '—',
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Risk Level',
                      value: demographics['risk_level']?.toString() ?? '—',
                      color: _riskColor(demographics['risk_level']?.toString()),
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Clinic Stage',
                      value: demographics['clinic_stage']?.toString() ?? '—',
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Next of Kin',
                      value:
                          '${demographics['next_of_kin_name'] ?? ''} • ${demographics['next_of_kin_phone'] ?? ''}',
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'LMP',
                      value: formatDate(demographics['lmp']?.toString()),
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'EDD',
                      value: formatDate(demographics['edd']?.toString()),
                    ),
                  ),
                  SizedBox(
                    width: tileWidth,
                    child: _InfoTile(
                      label: 'Facility',
                      value: demographics['health_facility_name']?.toString() ?? '—',
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Color _riskColor(String? r) {
    switch (r) {
      case 'HIGH':
        return AppColors.danger;
      case 'MEDIUM':
        return AppColors.warning;
      default:
        return AppColors.success;
    }
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _InfoTile({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgInput,
        borderRadius: BorderRadius.circular(16),
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
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: color ?? AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final ValueChanged<int> onTabChange;
  final VoidCallback onEdit;
  const _MenuCard({required this.onTabChange, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          _MenuTile(
            icon: Icons.edit_outlined,
            label: 'Edit Profile',
            onTap: onEdit,
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.history_outlined,
            label: 'ANC Journey',
            onTap: () => onTabChange(2),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.event_note_outlined,
            label: 'Appointments',
            onTap: () => onTabChange(1),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.menu_book_outlined,
            label: 'Learn',
            onTap: () => Navigator.of(context).pushNamed('/learn'),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.health_and_safety_outlined,
            label: 'Report Symptoms',
            onTap: () => Navigator.of(context).pushNamed('/symptoms'),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.notifications_outlined,
            label: 'Notifications',
            onTap: () => Navigator.of(context).pushNamed('/notifications'),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.forum_outlined,
            label: 'Messages',
            onTap: () => Navigator.of(context).pushNamed('/messages'),
          ),
          const Divider(height: 1),
          _MenuTile(
            icon: Icons.settings_outlined,
            label: 'Settings',
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _ClinicalNotesSection extends StatelessWidget {
  final List<dynamic> notes;
  const _ClinicalNotesSection({required this.notes});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.medical_services_outlined,
                  color: AppColors.primary, size: 20),
              SizedBox(width: 6),
              Text(
                'Clinical Notes',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (notes.isEmpty)
            const EmptyView(
              message: 'No clinical notes recorded yet',
              icon: Icons.note_outlined,
            )
          else
            ...notes.take(5).map(
                  (n) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.bgInput,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (n is Map && n['category'] != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryTint,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${n['category']}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              const Spacer(),
                              if (n is Map && n['created_at'] != null)
                                Text(
                                  formatDate(n['created_at'].toString()),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          if (n is Map && n['title'] != null)
                            Text(
                              '${n['title']}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          if (n is Map && n['content'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              '${n['content']}',
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}

class _DocumentsSection extends StatelessWidget {
  final List<dynamic> documents;
  const _DocumentsSection({required this.documents});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.description_outlined,
                  color: AppColors.primary, size: 20),
              SizedBox(width: 6),
              Text(
                'Documents',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (documents.isEmpty)
            const EmptyView(
              message: 'No documents uploaded',
              icon: Icons.file_copy_outlined,
            )
          else
            ...documents.take(5).map(
                  (d) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.bgInput,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.insert_drive_file_outlined,
                              color: AppColors.primary, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              d is Map ? '${d['title'] ?? 'Document'}' : '',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
        ],
      ),
    );
  }
}