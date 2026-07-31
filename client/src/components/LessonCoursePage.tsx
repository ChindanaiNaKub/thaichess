import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonRoute, routes } from '../lib/routes';
import { LESSON_MODULES, MAKRUK_LESSONS } from '../lib/lessons';
import { useLessonProgress, useLessonProgressSummary } from '../lib/lessonProgress';
import { isLessonUnlocked } from '../lib/lessonUnlock';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import { CoursePreviewBoard } from './LessonsShared';
import { shouldLogLessonDebug } from '../lib/lessonSharedUtils';

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
            type="button"
            onClick={() => navigate(routes.puzzleStreak)}
            className="text-sm text-text-dim transition-colors hover:text-text-bright"
          >
            {t('puzzle.streak_nav')}
          </button>
        )}
      />

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-text-bright sm:text-4xl">
            {t('lessons.course.title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-dim sm:text-base">
            {t('lessons.course.desc')}
          </p>
          <p className="mt-4 text-sm text-text-dim">
            {t('lessons.course.module_progress', {
              done: lessonSummary.completedCount,
              total: lessonSummary.totalCount,
            })}
          </p>
        </header>

        {nextLesson ? (
          <section className="ui-card mt-8 grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-text-bright">
                {nextLesson.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-dim">
                {nextLesson.objective}
              </p>
              <p className="mt-3 text-sm text-text-dim">
                {t(`puzzle.${nextLesson.level}`)}
                {' · '}
                {t('lessons.course.minutes', { minutes: nextLesson.estimatedMinutes })}
              </p>
              <button
                type="button"
                onClick={() => navigate(lessonRoute(nextLesson.id))}
                className="button-accent-contrast mt-5 rounded-[0.6rem] px-5 py-3 text-sm font-bold"
              >
                {t('lessons.course.start_lesson')}
              </button>
            </div>
            <div className="justify-self-center lg:justify-self-end">
              <CoursePreviewBoard scene={nextLesson.example} />
            </div>
          </section>
        ) : (
          <section className="ui-card mt-8 p-5 sm:p-6">
            <h2 className="text-2xl font-bold tracking-tight text-text-bright">
              {t('lessons.course.complete_title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-dim">
              {t('lessons.course.complete_desc')}
            </p>
            <button
              type="button"
              onClick={() => navigate(routes.puzzles)}
              className="ui-btn-secondary mt-5 px-5 py-3 text-sm"
            >
              {t('lessons.course.go_to_puzzles')}
            </button>
          </section>
        )}

        <div className="mt-12 space-y-10">
          {LESSON_MODULES.map((module) => {
            const completedInModule = module.lessons.filter((lesson) => completedLessonSet.has(lesson.id)).length;

            return (
              <section key={module.id}>
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-text-bright">{module.title}</h2>
                    <p className="mt-1 max-w-3xl text-sm text-text-dim">{module.description}</p>
                  </div>
                  <p className="text-sm text-text-dim">
                    {t('lessons.course.module_progress', {
                      done: completedInModule,
                      total: module.lessons.length,
                    })}
                  </p>
                </div>

                <ul className="divide-y divide-surface-hover/70 border-y border-surface-hover/70">
                  {module.lessons.map((lesson) => {
                    const completed = completedLessonSet.has(lesson.id);
                    const unlocked = isLessonUnlocked(lesson.id, completedLessonSet);
                    const started = startedLessonSet.has(lesson.id);
                    const statusLabel = completed
                      ? t('lessons.course.status.completed')
                      : unlocked
                        ? (started ? t('lessons.course.status.resume') : t('lessons.course.status.unlocked'))
                        : t('lessons.course.status.locked');

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => unlocked && navigate(lessonRoute(lesson.id))}
                          disabled={!unlocked}
                          className={`flex w-full flex-col gap-1 py-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
                            unlocked ? 'hover:bg-surface-hover/40' : 'cursor-not-allowed opacity-55'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-text-bright">{lesson.title}</p>
                            <p className="mt-1 text-sm text-text-dim">{lesson.objective}</p>
                            <p className="mt-1 text-xs text-text-dim">
                              {t('lessons.course.lesson_label', { order: lesson.order })}
                              {' · '}
                              {t(`puzzle.${lesson.level}`)}
                              {' · '}
                              {t('lessons.course.minutes', { minutes: lesson.estimatedMinutes })}
                            </p>
                          </div>
                          <span className={`shrink-0 text-sm font-medium ${
                            completed ? 'text-accent' : 'text-text-dim'
                          }`}>
                            {statusLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
