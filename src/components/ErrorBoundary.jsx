import { Component } from 'react';

const COPY = {
  vi: {
    title: 'Đã xảy ra sự cố',
    body: 'Trang gặp lỗi ngoài ý muốn. Bạn có thể tải lại trang hoặc quay về trang chủ. Nếu cần hỗ trợ, vui lòng liên hệ Lune.',
    reload: 'Tải lại trang',
    home: 'Về trang chủ',
  },
  en: {
    title: 'Something went wrong',
    body: 'The page hit an unexpected error. You can reload or return to the homepage. If you need help, please contact Lune.',
    reload: 'Reload page',
    home: 'Back to home',
  },
};

function readLanguage() {
  try {
    const stored = localStorage.getItem('lune_language') || localStorage.getItem('lune_guest_language');
    return stored && COPY[stored] ? stored : 'vi';
  } catch {
    return 'vi';
  }
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = readLanguage();
    const t = COPY[lang] || COPY.vi;

    return (
      <div className="grid min-h-screen place-items-center bg-lune-cream px-5 py-16">
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
          <h1 className="font-display text-3xl font-bold text-lune-ink">{t.title}</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">{t.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-lune-gold px-5 py-3 text-sm font-semibold text-white transition hover:bg-lune-goldDark"
              onClick={() => window.location.reload()}
            >
              {t.reload}
            </button>
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-lune-ink transition hover:border-lune-gold hover:text-lune-goldDark"
            >
              {t.home}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
