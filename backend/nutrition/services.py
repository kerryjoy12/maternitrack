"""
Intelligent Diet Recommendation Engine — Phase 4

Auto-detects maternal phase and conditions, then generates
appropriate nutrition plans from the DietPlan library.
"""
import logging
from datetime import date
from patients.models import Patient
from .models import (
    PatientNutritionProfile, DietPlan, DietRecommendation,
    NutritionCategory, WeightLog,
)

logger = logging.getLogger(__name__)


def detect_maternal_phase(patient: Patient) -> dict:
    """
    Analyze patient records to determine pregnancy phase and conditions.
    Returns a dict with phase, condition flags, and calorie target.
    """
    result = {
        'phase': 'ANC_T1',
        'is_anaemic': False,
        'is_hypertensive': False,
        'is_diabetic': False,
        'is_lactating': False,
        'is_post_caesarean': False,
        'calorie_target': 2200,
    }

    today = date.today()

    # Determine if postnatal
    has_postnatal = hasattr(patient, 'postnatal_records') and \
        patient.postnatal_records.exists()

    if has_postnatal:
        latest_delivery = patient.postnatal_records.order_by('-delivery_date').first()
        if latest_delivery:
            days_since = (today - latest_delivery.delivery_date).days
            if days_since <= 42:
                result['phase'] = 'POSTNATAL_EARLY'
                result['calorie_target'] = 2500
            else:
                result['phase'] = 'POSTNATAL_LATE'
                result['calorie_target'] = 2300

            result['is_lactating'] = True
            result['is_post_caesarean'] = latest_delivery.delivery_type == 'CAESAREAN'
    elif patient.lmp:
        # Determine trimester
        weeks = patient.weeks_pregnant or 0
        if weeks <= 13:
            result['phase'] = 'ANC_T1'
            result['calorie_target'] = 1800
        elif weeks <= 27:
            result['phase'] = 'ANC_T2'
            result['calorie_target'] = 2200
        else:
            result['phase'] = 'ANC_T3'
            result['calorie_target'] = 2400

    # Check clinical notes for conditions
    try:
        from clinical.models import ClinicalNote
        notes = ClinicalNote.objects.filter(patient=patient)
        diagnosis_text = ' '.join(
            notes.values_list('diagnosis_codes', flat=True)
        ).lower() + ' ' + ' '.join(
            notes.values_list('content', flat=True)
        ).lower()

        if any(k in diagnosis_text for k in ['anaemi', 'anemi', 'o99.0', 'iron deficien']):
            result['is_anaemic'] = True
        if any(k in diagnosis_text for k in ['hypertens', 'eclampsi', 'o13', 'o14', 'o16']):
            result['is_hypertensive'] = True
        if any(k in diagnosis_text for k in ['diabet', 'gestational diabet', 'o24']):
            result['is_diabetic'] = True
    except Exception:
        pass

    # Also check risk level
    if patient.risk_level == 'HIGH':
        result['calorie_target'] = max(result['calorie_target'], 2300)

    return result


def get_or_create_nutrition_profile(patient: Patient) -> PatientNutritionProfile:
    """
    Get or create a nutrition profile for a patient,
    auto-detecting phase and conditions.
    """
    detection = detect_maternal_phase(patient)

    profile, created = PatientNutritionProfile.objects.get_or_create(
        patient=patient,
        defaults=detection,
    )

    if not created:
        # Update with latest detection
        changed = False
        for key, value in detection.items():
            if getattr(profile, key, None) != value:
                setattr(profile, key, value)
                changed = True
        if changed:
            profile.save()

    return profile


def generate_recommendations(patient: Patient) -> list:
    """
    Generate personalized diet recommendations for a patient.
    Matches DietPlan entries to the patient's phase and conditions.
    """
    profile = get_or_create_nutrition_profile(patient)

    # Build condition tags for matching
    condition_tags = []
    if profile.is_anaemic:
        condition_tags.append('anaemia')
    if profile.is_hypertensive:
        condition_tags.append('hypertension')
    if profile.is_diabetic:
        condition_tags.append('diabetes')
    if profile.is_post_caesarean:
        condition_tags.append('caesarean')
    if profile.is_lactating:
        condition_tags.append('lactating')

    # Get matching plans — phase match is primary, condition match is bonus
    plans = DietPlan.objects.filter(
        phase=profile.phase, is_active=True
    )

    # If condition-specific plans exist, prefer them
    if condition_tags:
        from django.db.models import Q
        condition_q = Q()
        for tag in condition_tags:
            condition_q |= Q(condition_tags__icontains=tag)

        specific_plans = plans.filter(condition_q)
        if specific_plans.exists():
            plans = specific_plans

    # Create recommendations (avoid duplicates)
    created = []
    existing_plan_ids = set(
        DietRecommendation.objects.filter(
            patient=patient, status='ACTIVE'
        ).values_list('diet_plan_id', flat=True)
    )

    for plan in plans[:21]:  # Max 3 weeks of plans (7 days × 3 meals)
        if plan.id not in existing_plan_ids:
            rec = DietRecommendation.objects.create(
                patient=patient,
                diet_plan=plan,
            )
            created.append(rec)

    logger.info(
        'Generated %d diet recommendations for patient %s (phase=%s, conditions=%s)',
        len(created), patient.patient_number, profile.phase, condition_tags
    )

    return created


# ─── Default Diet Plans Seed Data ──────────────────────────────────────────────

SEED_PLANS = [
    # ANC Trimester 1
    {'phase': 'ANC_T1', 'meal_type': 'BREAKFAST', 'day_of_week': 1,
     'title': 'Iron-Fortified Porridge & Fruits',
     'description': 'Millet/sorghum porridge fortified with groundnuts, served with sliced banana and an orange for Vitamin C absorption.',
     'foods': 'millet porridge,groundnuts,banana,orange,milk',
     'calories_approx': 450, 'local_alternatives': 'Uji wa wimbi, ndizi, machungwa'},
    {'phase': 'ANC_T1', 'meal_type': 'LUNCH', 'day_of_week': 1,
     'title': 'Leafy Greens Stew with Ugali',
     'description': 'Sukuma wiki/spinach cooked with tomatoes and onions, served with ugali. Add a boiled egg for protein.',
     'foods': 'spinach,tomatoes,onions,ugali,egg',
     'calories_approx': 550, 'local_alternatives': 'Sukuma wiki na ugali, yai la kuchemsha'},
    {'phase': 'ANC_T1', 'meal_type': 'DINNER', 'day_of_week': 1,
     'title': 'Bean & Vegetable Soup',
     'description': 'Mixed beans soup with carrots, potatoes and green peppers. Rich in folate and iron.',
     'foods': 'beans,carrots,potatoes,green peppers',
     'calories_approx': 480, 'local_alternatives': 'Supu ya maharagwe na mboga'},
    # ANC Trimester 2
    {'phase': 'ANC_T2', 'meal_type': 'BREAKFAST', 'day_of_week': 1,
     'title': 'Egg & Avocado Power Breakfast',
     'description': 'Two boiled eggs with half avocado, whole wheat bread, and a glass of milk. High in protein, healthy fats, and calcium.',
     'foods': 'eggs,avocado,whole wheat bread,milk',
     'calories_approx': 520, 'local_alternatives': 'Mayai, parachichi, mkate wa ngano'},
    {'phase': 'ANC_T2', 'meal_type': 'LUNCH', 'day_of_week': 1,
     'title': 'Fish & Rice with Vegetables',
     'description': 'Grilled tilapia with brown rice and steamed vegetables. Excellent source of DHA for fetal brain development.',
     'foods': 'tilapia,brown rice,broccoli,carrots',
     'calories_approx': 620, 'local_alternatives': 'Samaki wa kukaanga, wali, mboga za kuchemsha'},
    # ANC Trimester 3
    {'phase': 'ANC_T3', 'meal_type': 'BREAKFAST', 'day_of_week': 1,
     'title': 'Calcium-Rich Morning Start',
     'description': 'Yoghurt with chia seeds, honey, and diced mango. Glass of fresh fruit juice.',
     'foods': 'yoghurt,chia seeds,honey,mango,fruit juice',
     'calories_approx': 480, 'local_alternatives': 'Maziwa lala, asali, embe'},
    {'phase': 'ANC_T3', 'meal_type': 'LUNCH', 'day_of_week': 1,
     'title': 'Chicken & Sweet Potato Plate',
     'description': 'Grilled chicken breast with roasted sweet potatoes and steamed kale. Iron and protein-dense.',
     'foods': 'chicken breast,sweet potatoes,kale',
     'calories_approx': 650, 'local_alternatives': 'Kuku choma, viazi vitamu, sukuma'},
    # Postnatal Early
    {'phase': 'POSTNATAL_EARLY', 'meal_type': 'BREAKFAST', 'day_of_week': 1,
     'title': 'Lactation-Boosting Porridge',
     'description': 'Oat porridge with fenugreek, dates, and warm milk. Known to enhance breast milk production.',
     'foods': 'oats,fenugreek,dates,warm milk',
     'calories_approx': 500, 'local_alternatives': 'Uji wa oats na tende, maziwa ya moto'},
    {'phase': 'POSTNATAL_EARLY', 'meal_type': 'LUNCH', 'day_of_week': 1,
     'title': 'High-Iron Recovery Meal',
     'description': 'Liver stew with brown ugali and steamed greens. Critical for post-delivery iron replacement.',
     'foods': 'liver,ugali,greens,tomato sauce',
     'calories_approx': 620, 'local_alternatives': 'Maini ya ng\'ombe, ugali wa wimbi, mboga'},
    {'phase': 'POSTNATAL_EARLY', 'meal_type': 'DINNER', 'day_of_week': 1,
     'title': 'Wound Healing Soup',
     'description': 'Bone broth with vegetables, rich in collagen and zinc for tissue repair.',
     'foods': 'bone broth,carrots,onions,garlic,ginger',
     'calories_approx': 380, 'local_alternatives': 'Supu ya mifupa na mboga'},
    # Postnatal Late
    {'phase': 'POSTNATAL_LATE', 'meal_type': 'BREAKFAST', 'day_of_week': 1,
     'title': 'Energy Recovery Smoothie',
     'description': 'Banana-peanut butter smoothie with milk and a handful of nuts. Sustained energy for new mothers.',
     'foods': 'banana,peanut butter,milk,mixed nuts',
     'calories_approx': 450, 'local_alternatives': 'Ndizi, karanga, maziwa'},
]


def seed_default_plans():
    """Populate default diet plans if none exist."""
    if DietPlan.objects.exists():
        logger.info('Diet plans already seeded — skipping.')
        return

    for plan_data in SEED_PLANS:
        DietPlan.objects.create(**plan_data)

    # Seed categories
    categories = [
        ('Iron-Rich Foods', '🥩', '#DC2626'),
        ('Protein Sources', '🥚', '#F59E0B'),
        ('Calcium Foods', '🥛', '#3B82F6'),
        ('Folic Acid', '🥬', '#10B981'),
        ('Hydration', '💧', '#06B6D4'),
        ('Lactation Support', '🤱', '#8B5CF6'),
        ('Wound Healing', '🩹', '#EC4899'),
        ('Energy Foods', '⚡', '#F97316'),
    ]
    for i, (name, icon, color) in enumerate(categories):
        NutritionCategory.objects.get_or_create(
            name=name,
            defaults={'icon': icon, 'color_hex': color, 'sort_order': i}
        )

    logger.info('Seeded %d default diet plans and %d categories.', len(SEED_PLANS), len(categories))
