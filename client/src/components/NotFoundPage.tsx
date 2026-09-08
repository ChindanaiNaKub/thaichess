import { Link } from 'react-router-dom';
import { routes } from '../lib/routes';

export default function NotFoundPage() {
  return (
    <main id="main-content" className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
      <p className="text-5xl font-bold text-primary mb-3">404</p>
      <h1 className="text-xl font-semibold text-text-bright mb-2">Page not found · ไม่พบหน้านี้</h1>
      <p className="text-text-dim max-w-sm mb-6">
        The page you are looking for does not exist. หน้าที่คุณค้นหาไม่มีอยู่บน ThaiChess
      </p>
      <Link
        to={routes.home}
        className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
      >
        กลับหน้าหลัก · Back home
      </Link>
    </main>
  );
}
