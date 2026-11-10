import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, X, Sparkles, BookOpen, ArrowLeft, CheckCircle2, Phone, AlertTriangle } from 'lucide-react';
import { motherApi } from '../api';
import { MotherPregnancyTrackingData } from '../types';
import { CATEGORIES, WARNING_SIGNS, QUICK_TIPS, ARTICLES, WEEK_GUIDES, findClosestWeek, getTrimester, CategorySlug, ContentItem, WeekGuide } from '../data/learnContent';

type View = 'home' | 'category' | 'article' | 'week' | 'warnings';

export default function MotherLearn() {
  const [data, setData] = useState<MotherPregnancyTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ContentItem | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await motherApi.pregnancyTracking();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const weeks_pregnant = data?.weeks_pregnant;
  const stage: 'pregnant' | 'postnatal' = weeks_pregnant && weeks_pregnant > 0 ? 'pregnant' : 'postnatal';
  const trimester = weeks_pregnant ? getTrimester(weeks_pregnant) : null;

  const openCategory = (slug: CategorySlug) => {
    setSelectedCategory(slug);
    setView('category');
  };

  const openArticle = (article: ContentItem) => {
    setSelectedArticle(article);
    setView('article');
  };

  const openWeek = (week: number) => {
    setSelectedWeek(week);
    setView('week');
  };

  const goHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSelectedWeek(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 72px)' }}>
      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto pb-32">
        {view === 'home' && (
          <HomeView
            weeksPregnant={weeks_pregnant}
            trimester={trimester}
            stage={stage}
            onOpenCategory={openCategory}
            onOpenArticle={openArticle}
            onOpenWeek={openWeek}
            onOpenWarnings={() => setView('warnings')}
          />
        )}
        {view === 'category' && selectedCategory && (
          <CategoryView
            slug={selectedCategory}
            stage={stage}
            onBack={goHome}
            onOpenArticle={openArticle}
            onOpenWarnings={() => setView('warnings')}
          />
        )}
        {view === 'article' && selectedArticle && (
          <ArticleView article={selectedArticle} onBack={goHome} />
        )}
        {view === 'week' && selectedWeek && (
          <WeekView week={selectedWeek} guide={WEEK_GUIDES[selectedWeek]} onBack={goHome} />
        )}
        {view === 'warnings' && (
          <WarningsView onBack={goHome} />
        )}
      </div>
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({
  weeksPregnant, trimester, stage, onOpenCategory, onOpenArticle, onOpenWeek, onOpenWarnings,
}: {
  weeksPregnant?: number;
  trimester: 'first' | 'second' | 'third' | null;
  stage: 'pregnant' | 'postnatal';
  onOpenCategory: (slug: CategorySlug) => void;
  onOpenArticle: (a: ContentItem) => void;
  onOpenWeek: (w: number) => void;
  onOpenWarnings: () => void;
}) {
  // Build recommended list
  const recommended = useMemo(() => {
    if (stage !== 'pregnant' || !weeksPregnant) return [];
    const items: { title: string; subtitle: string; onClick: () => void }[] = [];
    const closest = findClosestWeek(weeksPregnant);
    items.push({
      title: `What is happening at week ${closest}`,
      subtitle: 'Your personalized week guide',
      onClick: () => onOpenWeek(closest),
    });
    if (trimester === 'second') {
      items.push({
        title: 'Nutrition During Second Trimester',
        subtitle: 'What to eat and why',
        onClick: () => onOpenCategory('nutrition'),
      });
      items.push({
        title: `Common Changes At ${weeksPregnant} Weeks`,
        subtitle: 'Your body this week',
        onClick: () => onOpenCategory('pregnancy'),
      });
    }
    if (trimester === 'third') {
      items.push({
        title: 'Preparing For Delivery',
        subtitle: 'Get ready for the big day',
        onClick: () => onOpenCategory('pregnancy'),
      });
      const kick = ARTICLES.find(a => a.id === 'kick-counts');
      if (kick) {
        items.push({
          title: 'Fetal Movement Tracking',
          subtitle: 'How to do kick counts',
          onClick: () => onOpenArticle(kick),
        });
      }
    }
    if (trimester === 'first') {
      items.push({
        title: 'Managing Early Pregnancy',
        subtitle: 'Coping with early symptoms',
        onClick: () => onOpenCategory('pregnancy'),
      });
    }
    return items;
  }, [stage, weeksPregnant, trimester, onOpenCategory, onOpenArticle, onOpenWeek]);

  return (
    <>
      {/* Hero */}
      <div className="mb-6 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-primary/10 to-pink-500/10 dark:from-primary/20 dark:to-pink-500/20 shadow-sm relative overflow-hidden">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <BookOpen className="text-primary" size={32} />
          Learn
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
          {stage === 'pregnant' && weeksPregnant
            ? `Educational guides tailored to week ${weeksPregnant} of your pregnancy`
            : 'Educational guides for you and your new baby'}
        </p>
        {stage === 'pregnant' && weeksPregnant && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
            <Sparkles className="text-yellow-500 dark:text-yellow-400" size={16} />
            <span className="text-slate-800 dark:text-white text-sm font-semibold">
              {trimester === 'first' && 'First Trimester'}
              {trimester === 'second' && 'Second Trimester'}
              {trimester === 'third' && 'Third Trimester'}
              {' '}• Week {weeksPregnant}
            </span>
          </div>
        )}
      </div>

      {/* Recommended For You */}
      {recommended.length > 0 && (
        <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-850 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Recommended For You
          </h2>
          <div className="space-y-3">
            {recommended.map((r, i) => (
              <button key={i} onClick={r.onClick}
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="text-primary shrink-0" size={16} />
                    <div className="text-slate-800 dark:text-white font-semibold text-sm">{r.title}</div>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs ml-6 font-bold">{r.subtitle}</div>
                </div>
                <ChevronRight className="text-slate-400 dark:text-slate-500 shrink-0" size={20} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning signs - always visible */}
      <button onClick={onOpenWarnings}
        className="w-full mb-6 rounded-3xl p-5 shadow-sm text-left transition-all bg-red-500/10 border border-red-500/20 hover:bg-red-500/15"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl shrink-0 bg-red-500/20">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-red-800 dark:text-red-200 font-bold text-base mb-0.5">Warning Signs</div>
            <div className="text-red-655 dark:text-red-400 text-xs font-bold">When to seek help immediately</div>
          </div>
          <ChevronRight className="text-red-655 dark:text-red-400 shrink-0" size={20} />
        </div>
      </button>

      {/* Categories */}
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-2">Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map(cat => (
          <button key={cat.slug} onClick={() => onOpenCategory(cat.slug)}
            className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-md min-h-[140px]"
          >
            <div className="p-3 rounded-2xl inline-flex mb-3 bg-primary/10">
              <span className="text-primary">{cat.icon}</span>
            </div>
            <h3 className="text-slate-850 dark:text-white font-bold text-sm md:text-base leading-tight mb-1">
              {cat.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-snug">{cat.description}</p>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Category View ────────────────────────────────────────────────────────────
function CategoryView({
  slug, stage, onBack, onOpenArticle, onOpenWarnings,
}: {
  slug: CategorySlug;
  stage: 'pregnant' | 'postnatal';
  onBack: () => void;
  onOpenArticle: (a: ContentItem) => void;
  onOpenWarnings: () => void;
}) {
  const category = CATEGORIES.find(c => c.slug === slug)!;
  const tips = QUICK_TIPS[slug] ?? [];
  const articles = ARTICLES.filter(a => a.category === slug);
  const showWarningsLink = slug === 'warning-signs';

  return (
    <>
      <BackBar onBack={onBack} title={category.title} />
      <div className="mb-6 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-primary/10 to-teal-500/10 dark:from-primary/20 dark:to-teal-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10">
            <span className="text-primary">{category.icon}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{category.title}</h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      {tips.length > 0 && (
        <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Quick Tips</h2>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="p-1.5 rounded-lg shrink-0 bg-primary/10 text-primary">
                  {tip.icon}
                </div>
                <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed flex-1">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      {articles.length > 0 ? (
        <>
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-3 px-2">Short Articles</h2>
          <div className="space-y-3 mb-6">
            {articles.map(article => (
              <button key={article.id} onClick={() => onOpenArticle(article)}
                className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-800 dark:text-white font-semibold text-sm mb-1">{article.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2">{article.body}</p>
                </div>
                <ChevronRight className="text-slate-400 dark:text-slate-500 shrink-0" size={20} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-550 dark:text-slate-400 text-sm">No articles yet for this category.</p>
        </div>
      )}

      {/* Inline warnings link for warning-signs category */}
      {showWarningsLink && (
        <div className="card bg-red-500/10 border border-red-500/20 shadow-sm p-6 mt-6">
          <h2 className="text-base font-bold text-red-700 dark:text-red-400 mb-3">Seek Medical Attention Immediately</h2>
          <div className="space-y-2">
            {WARNING_SIGNS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-2.5 bg-red-500/5 border border-red-500/10">
                <div className="text-red-600 dark:text-red-400 shrink-0 mt-0.5">{s.icon}</div>
                <p className="text-slate-800 dark:text-slate-300 text-sm flex-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Article View ─────────────────────────────────────────────────────────────
function ArticleView({ article, onBack }: { article: ContentItem; onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title={article.title} />
      <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-4">{article.title}</h1>
        <p className="text-slate-705 dark:text-slate-300 text-base leading-relaxed whitespace-pre-line">{article.body}</p>
      </div>
    </>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────
function WeekView({ week, guide, onBack }: { week: number; guide: WeekGuide; onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title={`Week ${week}`} />
      <div className="mb-6 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-250 dark:border-slate-800 bg-gradient-to-br from-primary/10 to-teal-500/10 dark:from-primary/20 dark:to-teal-500/20">
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest mb-2 font-bold">Pregnancy Guide</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-2">{guide.title}</h1>
        <p className="text-slate-700 dark:text-slate-300 text-sm">Your baby is about the size of <strong>{guide.babySize}</strong></p>
      </div>

      <Section title="Your Baby">
        <ul className="space-y-2">
          {guide.babyDev.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
              <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Your Body">
        <ul className="space-y-2">
          {guide.bodyChanges.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
              <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Recommended Actions">
        <ul className="space-y-2">
          {guide.actions.map((b, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm">
              <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

// ─── Warnings View ────────────────────────────────────────────────────────────
function WarningsView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <BackBar onBack={onBack} title="Warning Signs" />
      <div className="mb-6 rounded-3xl p-6 md:p-8 shadow-sm bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
          <h1 className="text-2xl md:text-3xl font-extrabold text-red-850 dark:text-red-400">Seek Medical Attention Immediately</h1>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-sm">If you experience any of these, go to your clinic or call right away.</p>
      </div>

      <div className="mt-6 space-y-3">
        {WARNING_SIGNS.map((s, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-start gap-3 bg-red-500/5 border border-red-500/10">
            <div className="p-2 rounded-xl shrink-0 bg-red-500/10">
              <div className="text-red-655 dark:text-red-400">{s.icon}</div>
            </div>
            <p className="text-slate-805 dark:text-slate-300 text-sm font-semibold flex-1">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-850 shadow-sm p-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
          <Phone className="text-primary" size={18} />
          Call your clinic
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">If you are not sure whether something is serious, call anyway. It is always better to be checked.</p>
        <a href="tel:999" className="block w-full text-center rounded-2xl py-3 font-bold text-white bg-primary hover:bg-primary/95 transition-all shadow-sm hover:shadow-md">
          Call Now
        </a>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function BackBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button onClick={onBack} className="p-2 rounded-full transition-all bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>
      <h2 className="text-lg font-bold text-slate-850 dark:text-white truncate">{title}</h2>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 card bg-white dark:bg-[#1A1F4A] border border-slate-100 dark:border-slate-800/50 shadow-sm p-5">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3 text-primary">{title}</h3>
      {children}
    </div>
  );
}
