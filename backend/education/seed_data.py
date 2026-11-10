"""
Seed data for the Educational Module.
Covers EmONC, PPH Prevention, Family Planning, and Adolescent Health.
"""
import logging
from .models import EducationCategory, EducationResource
from procedures.models import EmergencyProtocol, ClinicalProcedure

logger = logging.getLogger(__name__)

def seed_education():
    if EducationCategory.objects.exists():
        logger.info("Education data already seeded.")
        return

    # 1. Create Categories
    categories = {
        'emonc': EducationCategory.objects.create(name='EmONC Protocols', slug='emonc', icon='🚑', description='Emergency Obstetric and Newborn Care protocols and signal functions.'),
        'pph': EducationCategory.objects.create(name='PPH Prevention', slug='pph', icon='🩸', description='Protocols for preventing and managing Postpartum Hemorrhage.'),
        'fp': EducationCategory.objects.create(name='Family Planning', slug='family-planning', icon='💊', description='Resources on modern contraceptive methods and reproductive health.'),
        'general': EducationCategory.objects.create(name='General Maternity', slug='general-maternity', icon='🤰', description='General pregnancy care, danger signs, and birth preparedness.'),
    }

    # 2. Create Resources
    resources = [
        # --- DOCTORS/NURSES ---
        {
            'title': 'The 7 Signal Functions of BEmONC',
            'slug': 'bemonc-signal-functions',
            'category': categories['emonc'],
            'audience': 'NURSE',
            'summary': 'Essential signal functions required for Basic Emergency Obstetric and Newborn Care.',
            'content': """
                <h3>BEmONC Signal Functions</h3>
                <p>To reduce maternal mortality, every basic facility must be able to perform these 7 functions:</p>
                <ul>
                    <li><b>1. Parenteral Antibiotics:</b> For sepsis and infections.</li>
                    <li><b>2. Parenteral Uterotonics:</b> (Oxytocin) for PPH prevention and management.</li>
                    <li><b>3. Parenteral Anticonvulsants:</b> (Magnesium Sulphate) for eclampsia.</li>
                    <li><b>4. Manual Removal of Placenta:</b> For retained placenta.</li>
                    <li><b>5. Removal of Retained Products:</b> (MVA) for incomplete abortion.</li>
                    <li><b>6. Assisted Vaginal Delivery:</b> (Vacuum extraction).</li>
                    <li><b>7. Neonatal Resuscitation:</b> (Bag and mask).</li>
                </ul>
                <p>Comprehensive EmONC (CEmONC) also includes <b>Surgery (C-section)</b> and <b>Blood Transfusion</b>.</p>
            """,
            'protocols': ['PPH', 'ECLAMPSIA', 'NEONATAL_RESUS', 'SEPSIS']
        },
        {
            'title': 'Active Management of Third Stage of Labour (AMTSL)',
            'slug': 'amtsl-pph-prevention',
            'category': categories['pph'],
            'audience': 'NURSE',
            'summary': 'Evidence-based steps to prevent Postpartum Hemorrhage during delivery.',
            'content': """
                <h3>Preventing PPH with AMTSL</h3>
                <p>AMTSL reduces the risk of PPH by 60%. The three critical steps are:</p>
                <ol>
                    <li><b>Uterotonic Administration:</b> Give 10 IU of Oxytocin IM immediately (within 1 minute) after delivery of the baby (and ruling out a second twin).</li>
                    <li><b>Controlled Cord Traction (CCT):</b> Apply gentle traction to the cord only during a contraction while applying counter-pressure to the uterus above the pubic bone.</li>
                    <li><b>Uterine Massage:</b> Massage the fundus immediately after placenta delivery until it is firm. Check every 15 minutes for the first 2 hours.</li>
                </ol>
            """,
            'procedures': ['NORMAL_DELIVERY'],
            'protocols': ['PPH']
        },
        # --- PATIENTS/PARTNERS ---
        {
            'title': 'Danger Signs During Pregnancy',
            'slug': 'pregnancy-danger-signs',
            'category': categories['general'],
            'audience': 'PATIENT',
            'summary': 'Warning signs that require immediate travel to the hospital.',
            'content': """
                <h3>When to seek help immediately</h3>
                <p>If you experience any of these signs, go to Itierio Nursing Home or the nearest hospital right away:</p>
                <ul>
                    <li><b>Vaginal Bleeding:</b> Any amount of blood during pregnancy.</li>
                    <li><b>Severe Headache:</b> Especially if combined with blurred vision.</li>
                    <li><b>Swelling:</b> Sudden swelling of face, hands, or feet.</li>
                    <li><b>Reduced Baby Movement:</b> If the baby is moving less than usual.</li>
                    <li><b>Fever:</b> High body temperature.</li>
                    <li><b>Waters Breaking:</b> Fluid leaking from the vagina before labour starts.</li>
                    <li><b>Persistent Vomiting:</b> Unable to keep any food or water down.</li>
                </ul>
            """
        },
        {
            'title': 'Modern Family Planning Methods',
            'slug': 'modern-fp-methods',
            'category': categories['fp'],
            'audience': 'PATIENT',
            'summary': 'Choosing the right contraceptive method for you after delivery.',
            'content': """
                <h3>Safe and Effective Family Planning</h3>
                <p>Family planning allows you to space your pregnancies for better health. Options include:</p>
                <ul>
                    <li><b>LARC (Long-Acting):</b> Implants (3-5 years) and IUDs (10 years). Highly effective and reversible.</li>
                    <li><b>Injections:</b> Given every 3 months (DMPA).</li>
                    <li><b>Pills:</b> Taken daily. Progestogen-only pills are safe while breastfeeding.</li>
                    <li><b>Barrier Methods:</b> Condoms (also protect against STIs/HIV).</li>
                    <li><b>Permanent Methods:</b> Tubal ligation or Vasectomy.</li>
                </ul>
                <p>Talk to your nurse during your next ANC or PNC visit to choose the best method for you.</p>
            """
        },
        # --- ADMINS ---
        {
            'title': 'Maternal Death Surveillance and Response (MDSR)',
            'slug': 'mdsr-admin-guide',
            'category': categories['emonc'],
            'audience': 'ADMIN',
            'summary': 'Guide for administrators on conducting maternal death audits and reviews.',
            'content': """
                <h3>The MDSR Cycle</h3>
                <p>To reduce preventable deaths, we must learn from every case:</p>
                <ol>
                    <li><b>Identification:</b> Notify every maternal and perinatal death within 24 hours.</li>
                    <li><b>Reporting:</b> Fill out the standard MoH audit forms.</li>
                    <li><b>Review:</b> Convene the facility MDSR committee to identify 'The Three Delays'.</li>
                    <li><b>Analysis:</b> Determine if the death was preventable.</li>
                    <li><b>Response:</b> Implement specific actions to prevent a similar occurrence.</li>
                </ol>
            """
        }
    ]

    for r_data in resources:
        protocols = r_data.pop('protocols', [])
        procedures = r_data.pop('procedures', [])
        res = EducationResource.objects.create(**r_data)
        
        # Link protocols
        for p_type in protocols:
            try:
                p = EmergencyProtocol.objects.get(emergency_type=p_type)
                res.related_protocols.add(p)
            except EmergencyProtocol.DoesNotExist:
                pass
                
        # Link procedures
        for p_cat in procedures:
            try:
                p = ClinicalProcedure.objects.get(category=p_cat)
                res.related_procedures.add(p)
            except ClinicalProcedure.DoesNotExist:
                pass

    logger.info("Seeded %d educational resources.", len(resources))
