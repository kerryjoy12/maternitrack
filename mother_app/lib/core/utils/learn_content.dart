import 'package:flutter/material.dart';

/// Static educational content used by the Learn screen.
/// Mirrors `frontend/src/data/learnContent.ts`.
class CategoryItem {
  final String slug;
  final String title;
  final String description;
  final IconData icon;
  final Color tintColor;
  const CategoryItem({
    required this.slug,
    required this.title,
    required this.description,
    required this.icon,
    required this.tintColor,
  });
}

class TipItem {
  final IconData icon;
  final String text;
  const TipItem({required this.icon, required this.text});
}

class Article {
  final String id;
  final String category;
  final String title;
  final String body;
  const Article({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
  });
}

class WeekGuide {
  final int week;
  final String title;
  final String babySize;
  final List<String> babyDev;
  final List<String> bodyChanges;
  final List<String> actions;
  const WeekGuide({
    required this.week,
    required this.title,
    required this.babySize,
    required this.babyDev,
    required this.bodyChanges,
    required this.actions,
  });
}

class WarningSign {
  final IconData icon;
  final String text;
  const WarningSign({required this.icon, required this.text});
}

class LearnContent {
  LearnContent._();

  static const List<CategoryItem> categories = [
    CategoryItem(
      slug: 'pregnancy',
      title: 'Pregnancy',
      description: 'Stages, symptoms, body changes and weekly guides.',
      icon: Icons.pregnant_woman_outlined,
      tintColor: Color(0xFF8B5CF6),
    ),
    CategoryItem(
      slug: 'nutrition',
      title: 'Nutrition',
      description: 'What to eat for a healthy pregnancy.',
      icon: Icons.restaurant_outlined,
      tintColor: Color(0xFFF59E0B),
    ),
    CategoryItem(
      slug: 'newborn',
      title: 'Newborn Care',
      description: 'Breastfeeding, sleep, and first days at home.',
      icon: Icons.child_care_outlined,
      tintColor: Color(0xFFEC4899),
    ),
    CategoryItem(
      slug: 'breastfeeding',
      title: 'Breastfeeding',
      description: 'Latch, frequency and common challenges.',
      icon: Icons.favorite_outline,
      tintColor: Color(0xFF10B981),
    ),
    CategoryItem(
      slug: 'family-planning',
      title: 'Family Planning',
      description: 'Birth spacing, contraception and counselling.',
      icon: Icons.groups_outlined,
      tintColor: Color(0xFF2563EB),
    ),
    CategoryItem(
      slug: 'warning-signs',
      title: 'Warning Signs',
      description: 'When to call your doctor or seek urgent care.',
      icon: Icons.warning_amber_outlined,
      tintColor: Color(0xFFEF4444),
    ),
  ];

  static const Map<String, List<TipItem>> quickTips = {
    'pregnancy': [
      TipItem(
        icon: Icons.local_drink_outlined,
        text: 'Drink at least 8 glasses of water every day.',
      ),
      TipItem(
        icon: Icons.directions_walk,
        text: 'Walk 30 minutes daily unless advised otherwise.',
      ),
      TipItem(
        icon: Icons.bedtime_outlined,
        text: 'Aim for 7–9 hours of sleep; rest on your left side.',
      ),
      TipItem(
        icon: Icons.smoke_free_outlined,
        text: 'Avoid smoking, alcohol and unprescribed medication.',
      ),
    ],
    'nutrition': [
      TipItem(
        icon: Icons.eco_outlined,
        text: 'Include iron-rich foods: leafy greens, beans, lean meat.',
      ),
      TipItem(
        icon: Icons.set_meal_outlined,
        text: 'Take your daily folic acid and prenatal vitamins.',
      ),
      TipItem(
        icon: Icons.no_food_outlined,
        text: 'Avoid raw fish, undercooked meat and unpasteurised milk.',
      ),
    ],
    'newborn': [
      TipItem(
        icon: Icons.thermostat_outlined,
        text: 'Keep your baby warm but not overheated.',
      ),
      TipItem(
        icon: Icons.cleaning_services_outlined,
        text: 'Wash hands before handling the baby.',
      ),
      TipItem(
        icon: Icons.healing_outlined,
        text: 'Cord stump – keep clean and dry until it falls off.',
      ),
    ],
    'breastfeeding': [
      TipItem(
        icon: Icons.access_time,
        text: 'Newborns feed 8–12 times in 24 hours.',
      ),
      TipItem(
        icon: Icons.water_drop_outlined,
        text: 'Look for 6+ wet nappies a day as a feeding sign.',
      ),
    ],
    'family-planning': [
      TipItem(
        icon: Icons.timer_outlined,
        text: 'Wait at least 24 months before next pregnancy.',
      ),
      TipItem(
        icon: Icons.privacy_tip_outlined,
        text: 'Discuss contraceptive options with your clinician.',
      ),
    ],
  };

  static const List<Article> articles = [
    Article(
      id: 'first-trimester',
      category: 'pregnancy',
      title: 'Your First Trimester',
      body:
          'The first trimester spans weeks 1 to 13. You may feel tired, have '
          'morning sickness, or notice breast tenderness. Attend your first '
          'ANC visit to confirm pregnancy, estimate your due date, and start '
          'prenatal vitamins.',
    ),
    Article(
      id: 'second-trimester',
      category: 'pregnancy',
      title: 'Your Second Trimester',
      body:
          'Weeks 14 to 27 are often called the "golden period". Energy returns '
          'and you may feel the first fetal movements. Anomaly ultrasound is '
          'usually done around week 20.',
    ),
    Article(
      id: 'third-trimester',
      category: 'pregnancy',
      title: 'Your Third Trimester',
      body:
          'Weeks 28 to 40 focus on birth preparation. Watch for warning signs, '
          'attend ANC visits, and prepare a birth plan with your clinician.',
    ),
    Article(
      id: 'kick-counts',
      category: 'pregnancy',
      title: 'Fetal Kick Counts',
      body:
          'From 28 weeks onwards, count fetal movements daily. You should feel '
          'at least 10 movements in 2 hours. Contact your clinic if movements '
          'decrease.',
    ),
    Article(
      id: 'iron-rich-foods',
      category: 'nutrition',
      title: 'Iron-Rich Foods',
      body:
          'Iron prevents anaemia. Combine iron sources with vitamin C for '
          'better absorption. Good sources include red meat, beans, dark '
          'leafy greens, and fortified cereals.',
    ),
    Article(
      id: 'prenatal-vitamins',
      category: 'nutrition',
      title: 'Prenatal Vitamins',
      body:
          'Take folic acid, iron, calcium and vitamin D as prescribed. Do not '
          'double up doses. Tell your clinician about any side effects.',
    ),
    Article(
      id: 'cord-care',
      category: 'newborn',
      title: 'Umbilical Cord Care',
      body:
          'Keep the cord stump clean and dry. Fold the nappy below the stump. '
          'See a clinician if it is red, smelly or has discharge.',
    ),
    Article(
      id: 'latching',
      category: 'breastfeeding',
      title: 'Getting a Good Latch',
      body:
          'Baby should open wide, take in the areola (not only the nipple), '
          'and you should hear swallowing. Pain usually means a poor latch — '
          'ask a nurse for help.',
    ),
    Article(
      id: 'spacing',
      category: 'family-planning',
      title: 'Birth Spacing',
      body:
          'Spacing pregnancies by at least 24 months reduces risks for mother '
          'and baby. Discuss contraception options before resuming sexual '
          'activity.',
    ),
  ];

  static const Map<int, WeekGuide> weekGuides = {
    8: WeekGuide(
      week: 8,
      title: 'Week 8 — First Trimester',
      babySize: 'Raspberry',
      babyDev: ['Heartbeat detectable on ultrasound', 'Tiny limb buds forming'],
      bodyChanges: ['Fatigue', 'Morning sickness may begin'],
      actions: [
        'Schedule first ANC visit',
        'Start prenatal vitamins',
      ],
    ),
    12: WeekGuide(
      week: 12,
      title: 'Week 12 — End of First Trimester',
      babySize: 'Plum',
      babyDev: ['Reflexes developing', 'Vocal cords forming'],
      bodyChanges: ['Energy may improve', 'Visible bump possible'],
      actions: ['Discuss genetic screening'],
    ),
    16: WeekGuide(
      week: 16,
      title: 'Week 16 — Second Trimester',
      babySize: 'Avocado',
      babyDev: ['Facial expressions begin', 'Hearing developing'],
      bodyChanges: ['Glow and hair growth', 'Possible round ligament pain'],
      actions: ['Begin light exercise'],
    ),
    20: WeekGuide(
      week: 20,
      title: 'Week 20 — Halfway There',
      babySize: 'Banana',
      babyDev: ['Movements felt (quickening)', 'Sleep cycles forming'],
      bodyChanges: ['Heartburn possible', 'Backache'],
      actions: ['Anomaly ultrasound scheduled'],
    ),
    24: WeekGuide(
      week: 24,
      title: 'Week 24 — Viability Milestone',
      babySize: 'Corn',
      babyDev: ['Lungs developing', 'Responds to sounds'],
      bodyChanges: ['Braxton Hicks possible', 'Stretch marks'],
      actions: ['Discuss birth plan'],
    ),
    28: WeekGuide(
      week: 28,
      title: 'Week 28 — Third Trimester Begins',
      babySize: 'Eggplant',
      babyDev: ['Eyes open and close', 'Brain developing rapidly'],
      bodyChanges: ['More frequent urination', 'Shortness of breath'],
      actions: ['Start daily kick counts'],
    ),
    32: WeekGuide(
      week: 32,
      title: 'Week 32 — Preparing for Birth',
      babySize: 'Squash',
      babyDev: ['Bones hardening', 'Practising breathing'],
      bodyChanges: ['Pelvic pressure', 'Trouble sleeping'],
      actions: ['Hospital bag ready'],
    ),
    36: WeekGuide(
      week: 36,
      title: 'Week 36 — Almost There',
      babySize: 'Romaine Lettuce',
      babyDev: ['Head may engage in pelvis', 'Fat layers building'],
      bodyChanges: ['Frequent contractions', 'Increased discharge'],
      actions: ['Weekly ANC visits'],
    ),
    40: WeekGuide(
      week: 40,
      title: 'Week 40 — Due Date',
      babySize: 'Watermelon',
      babyDev: ['Fully developed', 'Ready to meet you'],
      bodyChanges: ['Cervix ripening', 'Possible "bloody show"'],
      actions: ['Watch for labour signs'],
    ),
  };

  static const List<WarningSign> warningSigns = [
    WarningSign(
      icon: Icons.water_drop_outlined,
      text: 'Vaginal bleeding (any amount)',
    ),
    WarningSign(
      icon: Icons.psychology_outlined,
      text: 'Severe headache or blurred vision',
    ),
    WarningSign(
      icon: Icons.thermostat_outlined,
      text: 'High fever or chills',
    ),
    WarningSign(
      icon: Icons.sick_outlined,
      text: 'Persistent vomiting',
    ),
    WarningSign(
      icon: Icons.baby_changing_station_outlined,
      text: 'Reduced fetal movements',
    ),
    WarningSign(
      icon: Icons.warning_amber_outlined,
      text: 'Sudden swelling of face, hands or feet',
    ),
    WarningSign(
      icon: Icons.healing_outlined,
      text: 'Severe abdominal pain',
    ),
  ];

  static int findClosestWeek(int weeksPregnant) {
    final keys = weekGuides.keys.toList();
    int best = keys.first;
    int bestDiff = (best - weeksPregnant).abs();
    for (final k in keys) {
      final diff = (k - weeksPregnant).abs();
      if (diff < bestDiff) {
        best = k;
        bestDiff = diff;
      }
    }
    return best;
  }
}