import { LessonProgressProvider } from '../lib/lessonProgress';
import LessonCoursePage from '../components/LessonCoursePage';

export default function LessonCourseRoute() {
  return (
    <LessonProgressProvider>
      <LessonCoursePage />
    </LessonProgressProvider>
  );
}
