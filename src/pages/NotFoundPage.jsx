import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';

const COPY = {
  en: {
    title: 'Page not found',
    body: 'The page you are looking for does not exist or has moved.',
    backHome: 'Back to home',
    viewRooms: 'View rooms',
  },
  vi: {
    title: 'Không tìm thấy trang',
    body: 'Trang bạn tìm không tồn tại hoặc đã được di chuyển.',
    backHome: 'Về trang chủ',
    viewRooms: 'Xem phòng',
  },
  zh: {
    title: '页面未找到',
    body: '您查找的页面不存在或已被移动。',
    backHome: '返回首页',
    viewRooms: '查看房间',
  },
  ko: {
    title: '페이지를 찾을 수 없습니다',
    body: '찾으시는 페이지가 존재하지 않거나 이동되었습니다.',
    backHome: '홈으로',
    viewRooms: '객실 보기',
  },
};

export default function NotFoundPage() {
  const { currentLanguage } = useTranslation();
  const c = COPY[currentLanguage] || COPY.en;
  useDocumentMeta({ title: `${c.title} | ${BRAND}`, path: '/404', noindex: true });

  return (
    <section className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
          <p className="eyebrow">404</p>
          <h1 className="section-title mt-3">{c.title}</h1>
          <p className="mt-4 text-sm leading-7 text-stone-600">{c.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-gold">
              {c.backHome}
            </Link>
            <Link to="/rooms" className="btn-secondary">
              {c.viewRooms}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
