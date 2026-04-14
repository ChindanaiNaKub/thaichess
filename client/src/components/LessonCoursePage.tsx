import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonRoute, routes } from '../lib/routes';
import { LESSON_MODULES, MAKRUK_LESSONS } from '../lib/lessons';
import { isLessonUnlocked, useLessonProgress, useLessonProgressSummary } from '../lib/lessonProgress';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import {
  CoursePreviewBoard,
  formatConceptLabel,
  getDifficultyBadgeClasses,
  shouldLogLessonDebug,
} from './LessonsShared';

export default function LessonCoursePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { completedLessonSet, startedLessonSet } = useLessonProgress();
  const lessonSummary = useLessonProgressSummary();
  const nextLesson = lessonSummary.nextLesson ?? MAKRUK_LESSONS[0] ?? null;

  useEffect(() => {
    if (!shouldLogLessonDebug()) return;
    console.info('[LessonsPage] lesson catalog loaded', {
      source: 'client/src/lib/lessons.ts',
      moduleCount: LESSON_MODULES.length,
      lessonCount: MAKRUK_LESSONS.length,
      sampleLesson: MAKRUK_LESSONS[0]
        ? {
            id: MAKRUK_LESSONS[0].id,
            title: MAKRUK_LESSONS[0].title,
            dependsOnCounting: MAKRUK_LESSONS[0].dependsOnCounting,
            ruleImpact: MAKRUK_LESSONS[0].ruleImpact,
          }
        : null,
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        active="lessons"
        subtitle={t('nav.lessons')}
        right={(
          <button
            onClick={() => navigate(routes.puzzleStreak)}
            className="text-sm text-text-dim hover:text-text-bright transition-colors"
          >
            {t('puzzle.streak_nav')}
          </button>
        )}
      />

      <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 max-w-6xl mx-auto w-full">
        <section className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,_rgba(121,181,62,0.18),_transparent_38%),linear-gradient(135deg,rgba(25,31,20,0.96),rgba(18,16,13,0.92))] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_320px]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary-light/80">{t('lessons.course.eyebrow')}</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-text-bright">{t('lessons.course.title')}</h1>
              <p className="mt-3 max-w-3xl text-sm sm:text-base text-text-dim leading-relaxed">
                {t('lessons.course.desc')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.progress')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">
                    {lessonSummary.completedCount}/{lessonSummary.totalCount}
                  </div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.completed')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.shape')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">3</div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.shape_desc')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.format')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">{t('lessons.course.stats.format_value')}</div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.format_desc')}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-bright font-medium">{t('lessons.course.progress_label')}</span>
                  <span className="text-text-dim">{t('lessons.course.progress_value', { percent: lessonSummary.percentComplete })}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${lessonSummary.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-primary/25 bg-surface/75 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.course.next_lesson')}</p>
              {nextLesson ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold text-text-bright">{nextLesson.title}</h2>
                  <p className="mt-2 text-sm text-text-dim leading-relaxed">{nextLesson.objective}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${getDifficultyBadgeClasses(nextLesson.level)}`}>
                      {t(`puzzle.${nextLesson.level}`)}
                    </span>
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                      {t('lessons.course.minutes', { minutes: nextLesson.estimatedMinutes })}
                    </span>
                  </div>
                  <div className="mt-4">
                    <CoursePreviewBoard scene={nextLesson.example} />
                  </div>
                  <button
                    onClick={() => navigate(lessonRoute(nextLesson.id))}
                    className="mt-5 w-full rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-3 transition-colors"
                  >
                    {t('lessons.course.start_lesson')}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-semibold text-text-bright">{t('lessons.course.complete_title')}</h2>
                  <p className="mt-2 text-sm text-text-dim leading-relaxed">
                    {t('lessons.course.complete_desc')}
                  </p>
                  <button
                    onClick={() => navigate(routes.puzzles)}
                    className="mt-5 w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-text-bright font-semibold transition-colors hover:bg-surface-hover"
                  >
                    {t('lessons.course.go_to_puzzles')}
                  </button>
                </>
              )}
            </aside>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {LESSON_MODULES.map((module) => {
            const completedInModule = module.lessons.filter(lesson => completedLessonSet.has(lesson.id)).length;

            return (
              <div key={module.id} className="rounded-3xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t(`puzzle.${module.level}`)}</div>
                    <h2 className="mt-2 text-2xl font-semibold text-text-bright">{module.title}</h2>
                    <p className="mt-2 text-sm text-text-dim max-w-3xl">{module.description}</p>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-sm font-medium text-text-bright">{t('lessons.course.module_progress', { done: completedInModule, total: module.lessons.length })}</div>
                    <div className="mt-2 h-2 w-full sm:w-40 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.round((completedInModule / module.lessons.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {module.lessons.map((lesson) => {
                    const completed = completedLessonSet.has(lesson.id);
                    const unlocked = isLessonUnlocked(lesson.id, completedLessonSet);
                    const started = startedLessonSet.has(lesson.id);
                    const cardClasses = completed
                      ? 'border-primary/35 bg-primary/10'
                      : unlocked
                        ? 'border-surface-hover bg-surface hover:border-primary/40 hover:bg-surface-hover'
                        : 'border-surface-hover/50 bg-surface/45 opacity-70';

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => unlocked && navigate(lessonRoute(lesson.id))}
                        disabled={!unlocked}
                        className={`rounded-2xl border p-4 text-left transition-all ${cardClasses}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-text-dim">
                              {t('lessons.course.lesson_label', { order: lesson.order })}
                            </div>
                            <h3 className="mt-1 text-lg font-semibold text-text-bright">{lesson.title}</h3>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            completed
                              ? 'border-primary/35 bg-primary/10 text-primary-light'
                              : unlocked
                                ? 'border-surface-hover bg-surface text-text-dim'
                                : 'border-surface-hover/60 bg-surface/60 text-text-dim'
                          }`}>
                            {completed
                              ? t('lessons.course.status.completed')
                              : unlocked
                                ? (started ? t('lessons.course.status.resume') : t('lessons.course.status.unlocked'))
                                : t('lessons.course.status.locked')}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-text-dim leading-relaxed">{lesson.objective}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${getDifficultyBadgeClasses(lesson.level)}`}>
                            {t(`puzzle.${lesson.level}`)}
                          </span>
                          <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                            {t('lessons.course.minutes', { minutes: lesson.estimatedMinutes })}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {lesson.concepts.slice(0, 3).map((concept) => (
                            <span key={concept} className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                              {formatConceptLabel(concept)}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
