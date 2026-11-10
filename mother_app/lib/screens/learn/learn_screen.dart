import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/mother_api.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/learn_content.dart';
import '../../models/mother_dashboard.dart';
import '../../widgets/common_widgets.dart';

class LearnScreen extends StatefulWidget {
  const LearnScreen({super.key});

  @override
  State<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends State<LearnScreen> {
  Future<MotherPregnancyTrackingData>? _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<MotherApi>().pregnancyTracking();
  }

  String _trimester(int weeks) {
    if (weeks <= 13) return 'First Trimester';
    if (weeks <= 27) return 'Second Trimester';
    return 'Third Trimester';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Learn'),
        backgroundColor: AppColors.bgCard,
      ),
      body: FutureBuilder<MotherPregnancyTrackingData>(
        future: _future,
        builder: (context, snap) {
          final weeks = snap.data?.weeksPregnant ?? 0;
          final isPregnant = weeks > 0;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              HeroBanner(
                title: 'Learn',
                subtitle: isPregnant
                    ? 'Educational guides tailored to week $weeks of your pregnancy'
                    : 'Educational guides for you and your new baby',
                icon: Icons.menu_book_outlined,
                tintStart: AppColors.primary,
                tintEnd: AppColors.pink,
                iconColor: AppColors.primary,
              ),
              const SizedBox(height: 16),
              if (isPregnant)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.bgCard,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.auto_awesome,
                          color: AppColors.warning, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        '${_trimester(weeks)} • Week $weeks',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              InkWell(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const WarningsScreen(),
                )),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.dangerTint,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.danger.withValues(alpha: 0.30)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.20),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.warning_amber_outlined,
                            color: AppColors.danger, size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Warning Signs',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.danger,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'When to seek help immediately',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.danger,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.danger),
                    ],
                  ),
                ),
              ),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.95,
                children: LearnContent.categories.map((c) {
                  return InkWell(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CategoryScreen(slug: c.slug),
                      ),
                    ),
                    borderRadius: BorderRadius.circular(20),
                    child: AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: c.tintColor.withValues(alpha: 0.10),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(c.icon, color: c.tintColor),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            c.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            c.description,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Browse a single category of educational content.
class CategoryScreen extends StatelessWidget {
  final String slug;
  const CategoryScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context) {
    final category = LearnContent.categories
        .firstWhere((c) => c.slug == slug);
    final tips = LearnContent.quickTips[slug] ?? const <TipItem>[];
    final articles =
        LearnContent.articles.where((a) => a.category == slug).toList();

    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: Text(category.title),
        backgroundColor: AppColors.bgCard,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          HeroBanner(
            title: category.title,
            subtitle: category.description,
            icon: category.icon,
            tintStart: category.tintColor,
            tintEnd: AppColors.pink,
            iconColor: category.tintColor,
          ),
          const SizedBox(height: 16),
          if (tips.isNotEmpty) ...[
            const _SectionTitle('Quick Tips'),
            const SizedBox(height: 8),
            ...tips.map(
              (t) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgInput,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: category.tintColor.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(t.icon,
                          size: 16, color: category.tintColor),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        t.text,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          const _SectionTitle('Articles'),
          const SizedBox(height: 8),
          if (articles.isEmpty)
            AppCard(
              child: const EmptyView(
                message: 'No articles yet for this category.',
                icon: Icons.article_outlined,
              ),
            )
          else
            ...articles.map(
              (a) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: AppCard(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ArticleScreen(article: a),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.article_outlined,
                          color: AppColors.primary, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              a.title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              a.body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right,
                          color: AppColors.textMuted),
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

class ArticleScreen extends StatelessWidget {
  final Article article;
  const ArticleScreen({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Article'),
        backgroundColor: AppColors.bgCard,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  article.title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  article.body,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    height: 1.5,
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

class WarningsScreen extends StatelessWidget {
  const WarningsScreen({super.key});

  Future<void> _call(String number) async {
    final uri = Uri.parse('tel:$number');
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgBase,
      appBar: AppBar(
        title: const Text('Warning Signs'),
        backgroundColor: AppColors.bgCard,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.dangerTint,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.danger.withValues(alpha: 0.30)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Row(
                  children: [
                    Icon(Icons.warning_amber_outlined,
                        color: AppColors.danger, size: 28),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Seek Medical Attention Immediately',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.danger,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 6),
                Text(
                  'If you experience any of these, go to your clinic or call right away.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ...LearnContent.warningSigns.map(
            (w) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.dangerTint,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(w.icon, color: AppColors.danger, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      w.text,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.phone, color: AppColors.primary, size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Call your clinic',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'If you are not sure whether something is serious, call anyway. It is always better to be checked.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => _call('999'),
                  icon: const Icon(Icons.phone),
                  label: const Text('Call Now'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}