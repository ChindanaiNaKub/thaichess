import { LessonProgressProvider } from '../lib/lessonProgress';
import LessonPlayerPage from '../components/LessonPlayerPage';

export default function LessonPlayerRoute() {
  return (
    <LessonProgressProvider>
      <LessonPlayerPage />
    </LessonProgressProvider>
  );
}
