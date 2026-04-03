import { LessonProgressProvider } from '../lib/lessonProgress';
import { LessonCoursePage, LessonPlayerPage } from '../components/LessonsPage';

export function LessonCourseRoute() {
  return (
    <LessonProgressProvider>
      <LessonCoursePage />
    </LessonProgressProvider>
  );
}

export function LessonPlayerRoute() {
  return (
    <LessonProgressProvider>
      <LessonPlayerPage />
    </LessonProgressProvider>
  );
}
