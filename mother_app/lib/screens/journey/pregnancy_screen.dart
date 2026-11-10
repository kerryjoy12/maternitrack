import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/date_utils.dart';
import '../../models/mother_dashboard.dart';
import '../../widgets/common_widgets.dart';

class PregnancyScreen extends StatefulWidget {
  const PregnancyScreen({super.key});

  @override
  State<PregnancyScreen> createState() => _PregnancyScreenState();
}

class _PregnancyScreenState extends State<PregnancyScreen> {
  late Future<MotherPregnancyTrackingData> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().pregnancyTracking();
  }

  Future<void> _reload() async {
    setState(() {
      _future = context.read<MotherApi>().pregnancyTracking();
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _reload,
      child: FutureBuilder<MotherPregnancyTrackingData>(
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
                  message: 'Could not load pregnancy tracking.',
                  onRetry: _reload,
                ),
              ],
            );
          }
          final data = snap.data!;
          final weeks = data.weeksPregnant ?? 0;
          final daysLeft = data.edd.isNotEmpty
              ? DateTime.tryParse(data.edd)
                      ?.difference(DateTime.now())
                      .inDays ??
                  0
              : 0;
          final progress = (weeks / 40).clamp(0.0, 1.0);

          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _HeroSection(
                weeks: weeks,
                daysLeft: daysLeft,
                trimester: data.trimesterInfo,
              ),
              const SizedBox(height: 16),
              _ProgressCard(progress: progress, weeks: weeks),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _SmallInfo(
                      label: 'Last Menstrual Period',
                      value: formatDate(data.lmp),
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SmallInfo(
                      label: 'Expected Delivery',
                      value: formatDate(data.edd),
                      color: AppColors.pink,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.event_note_outlined,
                            color: AppColors.primary, size: 20),
                        SizedBox(width: 6),
                        Text(
                          'Pregnancy Journey',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (data.milestones.isEmpty)
                      const EmptyView(message: 'No milestones yet.'),
                    ...data.milestones
                        .take(6)
                        .map((m) => _MilestoneTile(m: m)),
                  ],
                ),
              ),
              if (data.ancVisits.isNotEmpty) ...[
                const SizedBox(height: 16),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.trending_up,
                            color: AppColors.primary, size: 20),
                          SizedBox(width: 6),
                          Text(
                            'Recent ANC Visits',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ...data.ancVisits.take(4).map(
                            (v) => _AncPreviewTile(
                              visit: v as Map<String, dynamic>,
                            ),
                          ),
                    ],
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  final int weeks;
  final int daysLeft;
  final String? trimester;
  const _HeroSection({
    required this.weeks,
    required this.daysLeft,
    this.trimester,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.10),
            AppColors.pink.withValues(alpha: 0.10),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.borderLight),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$weeks',
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'weeks',
                style: TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (trimester != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    trimester!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'of 40-week pregnancy',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const Icon(Icons.timer_outlined,
                  color: AppColors.primary, size: 18),
              const SizedBox(width: 6),
              Text(
                '$daysLeft days until EDD',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final double progress;
  final int weeks;
  const _ProgressCard({required this.progress, required this.weeks});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Pregnancy Progress',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              Text(
                '${(progress * 100).round()}%',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor: AppColors.bgInput,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Week $weeks',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Text(
                'Week 40',
                style: TextStyle(
                  fontSize: 11,
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

class _SmallInfo extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _SmallInfo({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w800,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _MilestoneTile extends StatelessWidget {
  final PregnancyMilestone m;
  const _MilestoneTile({required this.m});

  @override
  Widget build(BuildContext context) {
    final color = m.completed ? AppColors.success : AppColors.textMuted;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: m.completed
                  ? AppColors.success.withValues(alpha: 0.15)
                  : AppColors.bgInput,
            ),
            child: Icon(
              m.completed ? Icons.check_circle : Icons.radio_button_unchecked,
              color: color,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  m.name,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: m.completed
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                if (m.date != null)
                  Text(
                    formatDate(m.date),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
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

class _AncPreviewTile extends StatelessWidget {
  final Map<String, dynamic> visit;
  const _AncPreviewTile({required this.visit});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgInput,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.event_available_outlined,
              color: AppColors.primary, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Visit ${visit['visit_number'] ?? ''}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  formatDate(visit['visit_date']?.toString()),
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ],
      ),
    );
  }
}