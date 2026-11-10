import React from 'react';
import { Calendar, Apple, AlertTriangle, Baby, HeartPulse, Syringe, Brain, Droplet, Footprints, Salad, Bed, Moon, ShieldAlert, Image as ImageIcon, Wind, Activity, Frown, MessageCircle } from 'lucide-react';

export type CategorySlug = 'pregnancy' | 'nutrition' | 'warning-signs' | 'breastfeeding' | 'newborn-care' | 'vaccinations' | 'mental-wellness';

export interface Category {
  slug: CategorySlug;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
  border: string;
  accent: string;
}

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  appliesTo: ('pregnant' | 'postnatal')[];
  weeksRange?: [number, number];
  category: CategorySlug;
}

export interface WeekGuide {
  title: string;
  babySize: string;
  babyDev: string[];
  bodyChanges: string[];
  actions: string[];
}

export const CATEGORIES: Category[] = [
  { slug: 'pregnancy', title: 'Pregnancy Journey', description: 'Week-by-week guides and what to expect', icon: <Calendar size={28} />, bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(244, 199, 215, 0.15) 100%)', border: 'rgba(236, 72, 153, 0.35)', accent: '#f472b6' },
  { slug: 'nutrition', title: 'Nutrition', description: 'Healthy eating for you and baby', icon: <Apple size={28} />, bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(187, 247, 208, 0.15) 100%)', border: 'rgba(34, 197, 94, 0.35)', accent: '#86efac' },
  { slug: 'warning-signs', title: 'Warning Signs', description: 'When to seek help immediately', icon: <AlertTriangle size={28} />, bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(252, 165, 165, 0.15) 100%)', border: 'rgba(239, 68, 68, 0.4)', accent: '#fca5a5' },
  { slug: 'breastfeeding', title: 'Breastfeeding', description: 'Tips for a great start', icon: <Baby size={28} />, bgGradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2) 0%, rgba(251, 207, 232, 0.15) 100%)', border: 'rgba(244, 114, 182, 0.35)', accent: '#f9a8d4' },
  { slug: 'newborn-care', title: 'Newborn Care', description: 'Caring for your new baby', icon: <HeartPulse size={28} />, bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(199, 210, 254, 0.15) 100%)', border: 'rgba(99, 102, 241, 0.35)', accent: '#c7d2fe' },
  { slug: 'vaccinations', title: 'Vaccinations', description: 'Protecting you and your baby', icon: <Syringe size={28} />, bgGradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(94, 234, 212, 0.15) 100%)', border: 'rgba(20, 184, 166, 0.35)', accent: '#5eead4' },
  { slug: 'mental-wellness', title: 'Mental Wellness', description: 'Emotional health matters too', icon: <Brain size={28} />, bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(216, 180, 254, 0.15) 100%)', border: 'rgba(168, 85, 247, 0.35)', accent: '#d8b4fe' },
];

export const WARNING_SIGNS: { icon: React.ReactNode; text: string }[] = [
  { icon: <Droplet size={18} />, text: 'Vaginal bleeding' },
  { icon: <Brain size={18} />, text: 'Severe headache that will not go away' },
  { icon: <ImageIcon size={18} />, text: 'Blurred vision or seeing spots' },
  { icon: <Activity size={18} />, text: 'Convulsions or fits' },
  { icon: <Baby size={18} />, text: 'Reduced or no fetal movement' },
  { icon: <Wind size={18} />, text: 'Difficulty breathing' },
  { icon: <Frown size={18} />, text: 'Severe abdominal pain' },
  { icon: <Droplet size={18} />, text: 'Leaking fluid before 37 weeks' },
];

export const QUICK_TIPS: Record<CategorySlug, { icon: React.ReactNode; text: string }[]> = {
  pregnancy: [
    { icon: <Footprints size={18} />, text: 'Walk 30 minutes daily unless advised otherwise' },
    { icon: <Bed size={18} />, text: 'Sleep on your side, especially after 20 weeks' },
    { icon: <Calendar size={18} />, text: 'Attend all your ANC visits on schedule' },
  ],
  nutrition: [
    { icon: <Droplet size={18} />, text: 'Drink 2-3L of clean water daily' },
    { icon: <Salad size={18} />, text: 'Eat iron-rich foods (beans, meat, dark greens)' },
    { icon: <Apple size={18} />, text: 'Take your prenatal vitamins every day' },
  ],
  'warning-signs': [
    { icon: <ShieldAlert size={18} />, text: 'Save your clinic emergency number in your phone' },
    { icon: <Activity size={18} />, text: 'Trust your instincts — call if something feels wrong' },
    { icon: <Calendar size={18} />, text: 'Never ignore severe pain or sudden swelling' },
  ],
  breastfeeding: [
    { icon: <Baby size={18} />, text: 'Feed on demand, at least 8 times in 24 hours' },
    { icon: <Moon size={18} />, text: 'Skin-to-skin contact helps milk flow' },
    { icon: <HeartPulse size={18} />, text: 'Both breasts — alternate to keep supply up' },
  ],
  'newborn-care': [
    { icon: <Moon size={18} />, text: 'Always place baby on their back to sleep' },
    { icon: <Droplet size={18} />, text: 'Cord stump — keep clean and dry' },
    { icon: <HeartPulse size={18} />, text: 'Umbilical area should heal in 1-2 weeks' },
  ],
  vaccinations: [
    { icon: <Syringe size={18} />, text: 'BCG and OPV at birth protect your baby' },
    { icon: <Calendar size={18} />, text: 'Follow the KEPI schedule without delays' },
    { icon: <ShieldAlert size={18} />, text: 'Mild fever is normal after some vaccines' },
  ],
  'mental-wellness': [
    { icon: <HeartPulse size={18} />, text: 'It is normal to feel emotional after birth' },
    { icon: <MessageCircle size={18} />, text: 'Talk to someone you trust about how you feel' },
    { icon: <Moon size={18} />, text: 'Rest whenever your baby rests' },
  ],
};

export const ARTICLES: ContentItem[] = [
  { id: 'sleep-on-back', category: 'pregnancy', title: 'Can I sleep on my back?', body: 'After 20 weeks, it is best to sleep on your side — especially your left side. This helps blood flow to your baby. Use a pillow between your knees for comfort. If you wake up on your back, do not panic — just roll to your side.', appliesTo: ['pregnant'], weeksRange: [16, 40] },
  { id: 'iron-rich-foods', category: 'nutrition', title: 'Iron-rich foods for pregnancy', body: 'Iron helps prevent anaemia. Good sources include red meat, beans, lentils, dark green vegetables (like sukuma wiki), and eggs. Eat them with vitamin C foods (oranges, tomatoes) to help your body absorb the iron.', appliesTo: ['pregnant', 'postnatal'] },
  { id: 'kick-counts', category: 'pregnancy', title: 'Tracking fetal movement', body: 'From 28 weeks, you should feel at least 10 movements in 2 hours — usually much more. Do a daily kick count in the evening after a meal. If movements suddenly drop, lie on your left side and count. Still worried? Call your clinic.', appliesTo: ['pregnant'], weeksRange: [24, 40] },
  { id: 'first-feed', category: 'breastfeeding', title: 'Your first breastfeed', body: 'Put baby skin-to-skin within the first hour. They will usually crawl to the breast and start suckling. Do not worry if it takes time — it is a new skill for both of you. Ask your nurse for help if it feels painful.', appliesTo: ['postnatal'] },
  { id: 'cord-care', category: 'newborn-care', title: 'Caring for the cord stump', body: 'Keep the stump clean and dry. Fold the nappy below it. It will dry and fall off in 7-14 days. A little blood is normal. Call your clinic if you see pus, redness spreading, or a bad smell.', appliesTo: ['postnatal'] },
  { id: 'baby-blues', category: 'mental-wellness', title: 'Baby blues vs postnatal depression', body: 'Baby blues (tearful, anxious) usually pass within 2 weeks. Postnatal depression is deeper and lasts longer. Signs include: feeling hopeless, no joy in your baby, thoughts of harming yourself. Please tell someone and get help. You are not alone.', appliesTo: ['postnatal'] },
  { id: 'vaccines-birth', category: 'vaccinations', title: 'Vaccines at birth', body: 'Your baby should receive BCG (protects against tuberculosis) and OPV 0 (polio) within the first 2 weeks. Hepatitis B is given at 6 weeks. These vaccines are safe and free at your clinic.', appliesTo: ['postnatal'] },
  { id: 'morning-sickness', category: 'pregnancy', title: 'Managing morning sickness', body: 'Eat small meals often, avoid strong smells, try ginger tea or lemon water. Usually settles by 14-16 weeks. If you cannot keep any food or water down, call your clinic — you may need help.', appliesTo: ['pregnant'], weeksRange: [6, 16] },
  { id: 'swelling', category: 'pregnancy', title: 'Swelling in pregnancy', body: 'Mild swelling of feet and ankles is common, especially late in the day. Rest with your feet up. But sudden swelling of face and hands, with headache, can be a sign of pre-eclampsia — call your clinic right away.', appliesTo: ['pregnant'], weeksRange: [20, 40] },
  { id: 'latching', category: 'breastfeeding', title: 'How to get a good latch', body: 'Baby should open wide, with the chin pressed into your breast and most of the dark area (areola) in their mouth. You should feel pulling, not pinching. If it hurts, break the suction with your finger and try again.', appliesTo: ['postnatal'] },
  { id: 'sleep-safe', category: 'newborn-care', title: 'Safe sleep for your baby', body: 'Always place baby on their back to sleep. Use a firm, flat surface. No pillows, blankets, or soft toys in the cot. Share a room, not a bed. Breastfeeding reduces the risk of sudden infant death.', appliesTo: ['postnatal'] },
  { id: 'tetanus-vaccine', category: 'vaccinations', title: 'Tetanus vaccine in pregnancy', body: 'You should receive the tetanus vaccine during pregnancy to protect you and your baby. The full course is 5 doses. If you have had fewer than 3, you need more during this pregnancy. Ask your nurse at your next ANC.', appliesTo: ['pregnant'] },
  { id: 'anxiety-help', category: 'mental-wellness', title: 'When anxiety feels too much', body: 'Worry is normal in pregnancy and after birth. But if anxiety stops you sleeping, eating, or enjoying your baby, please ask for help. Your clinic can connect you with a counsellor. You do not have to face it alone.', appliesTo: ['pregnant', 'postnatal'] },
  { id: 'breastfeeding-frequency', category: 'breastfeeding', title: 'How often to feed', body: 'Newborns feed 8-12 times in 24 hours — that is every 2-3 hours, including at night. Watch for hunger cues: rooting, sucking on hands, opening mouth. Crying is a late sign. The more you feed, the more milk you make.', appliesTo: ['postnatal'] },
  { id: 'breastfeeding-pain', category: 'breastfeeding', title: 'Sore nipples', body: 'Some tenderness in the first week is normal. Pain that continues or cracks and bleeding are not. The most common cause is a poor latch. Ask your nurse to watch a feed and help you adjust. Lanolin cream can soothe between feeds.', appliesTo: ['postnatal'] },
];

export const WEEK_GUIDES: Record<number, WeekGuide> = {
  12: { title: 'Week 12 — First Trimester Ends', babySize: 'A plum (~14g)', babyDev: ['Reflexes are developing', 'Eyelids close to protect eyes'], bodyChanges: ['Morning sickness may be easing', 'Energy may start to return'], actions: ['Book your first ANC visit', 'Start prenatal vitamins'] },
  16: { title: 'Week 16 — Feeling Movement', babySize: 'An avocado (~100g)', babyDev: ['Skeleton is hardening', 'May make faces'], bodyChanges: ['You may feel the first flutters', 'Bump starts to show'], actions: ['Second ANC visit', 'Start maternity clothes'] },
  20: { title: 'Week 20 — Halfway There', babySize: 'A banana (~300g)', babyDev: ['Hearing is developing', 'Can hear your voice'], bodyChanges: ['Back pain may begin', 'Belly button may pop out'], actions: ['Anomaly ultrasound scan', 'Sign up for childbirth classes', 'Start sleeping on your side'] },
  24: { title: 'Week 24 — Viability Milestone', babySize: 'An ear of corn (~600g)', babyDev: ['Lungs are developing', 'Responds to sound'], bodyChanges: ['Braxton Hicks contractions may start', 'Back pain may increase', 'Sleep may become difficult'], actions: ['Attend ANC visit', 'Monitor fetal movements', 'Maintain iron supplements', 'Watch for preterm labour signs'] },
  28: { title: 'Week 28 — Third Trimester Begins', babySize: 'An eggplant (~1kg)', babyDev: ['Eyes can open and close', 'Brain is growing fast'], bodyChanges: ['More tired again', 'Heartburn is common', 'Swelling in feet'], actions: ['Start daily kick counts (10 in 2 hours)', 'ANC visits every 2 weeks', 'Plan your birth plan', 'Tetanus vaccine dose if due'] },
  32: { title: 'Week 32 — Final Planning', babySize: 'A squash (~1.7kg)', babyDev: ['Bones hardening', 'Practising breathing'], bodyChanges: ['Shortness of breath', 'Frequent urination', 'Trouble sleeping'], actions: ['Pack your hospital bag', 'Visit the maternity unit', 'Final birth plan review'] },
  36: { title: 'Week 36 — Baby Is Almost Here', babySize: 'A romaine lettuce (~2.6kg)', babyDev: ['Head may engage in pelvis', 'Lungs nearly mature'], bodyChanges: ['Easier to breathe when baby drops', 'More pelvic pressure', 'Braxton Hicks more often'], actions: ['Weekly ANC visits', 'Watch for signs of labour', 'Rest as much as possible'] },
  40: { title: 'Week 40 — Your Due Date', babySize: 'A watermelon (~3.5kg)', babyDev: ['Fully developed', 'Ready to meet you'], bodyChanges: ['Antsy and ready', 'Stronger Braxton Hicks'], actions: ['Stay calm', 'Call clinic if contractions are regular', 'Trust your body'] },
};

export function findClosestWeek(week: number): number {
  const keys = Object.keys(WEEK_GUIDES).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return 0;
  return keys.reduce((prev, curr) => (Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev), keys[0]);
}

export function getTrimester(week: number): 'first' | 'second' | 'third' {
  if (week <= 13) return 'first';
  if (week <= 27) return 'second';
  return 'third';
}
