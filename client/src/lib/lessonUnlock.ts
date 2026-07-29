import { MAKRUK_LESSONS } from './lessons';

export function isLessonUnlocked(lessonId: string, completedLessonSet: Set<string>): boolean {
  const lessonIndex = MAKRUK_LESSONS.findIndex(lesson => lesson.id === lessonId);
  if (lessonIndex === -1) return false;
  if (lessonIndex === 0) return true;
  return completedLessonSet.has(MAKRUK_LESSONS[lessonIndex - 1]!.id);
}
