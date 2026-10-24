import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const languages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'nl', label: '🇳🇱 Nederlands' },
  { code: 'zh-TW', label: '🇭🇰 Cantonese — 粵語 (Traditional Chinese)' },
  { code: 'zh-CN', label: '🇨🇳 Mandarin — 普通话' },
  { code: 'hi', label: '🇮🇳 Hindi — हिन्दी' },
];

export default function LanguageTranslator({ dark = false }: { dark?: boolean }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge-site-language');
      if (saved && languages.some(item => item.code === saved)) setLanguage(saved);
    } catch {}

    const initialize = () => {
      const GoogleTranslate = window.google?.translate?.TranslateElement;
      if (!GoogleTranslate || document.getElementById('pledge-google-translate')?.dataset.ready === 'true') return;
      new GoogleTranslate({
        pageLanguage: 'en',
        includedLanguages: 'en,es,fr,it,pt,nl,zh-CN,zh-TW,hi',
        autoDisplay: false,
      }, 'pledge-google-translate');
      const container = document.getElementById('pledge-google-translate');
      if (container) container.dataset.ready = 'true';
    };

    window.googleTranslateElementInit = initialize;
    if (!document.querySelector('script[data-pledge-google-translate]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.pledgeGoogleTranslate = 'true';
      script.onerror = () => { script.remove(); };
      document.head.appendChild(script);
    } else {
      initialize();
    }
    return () => {
      if (window.googleTranslateElementInit === initialize) delete window.googleTranslateElementInit;
    };
  }, []);

  const changeLanguage = (code: string) => {
    setLanguage(code);
    try { localStorage.setItem('pledge-site-language', code); } catch {}
    const apply = () => {
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (!combo) return false;
      combo.value = code === 'en' ? '' : code;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    if (apply()) return;
    window.setTimeout(apply, 350);
    window.setTimeout(apply, 1000);
  };

  return <div className="relative flex items-center gap-2">
    <label htmlFor="pledge-language-select" className="sr-only">Translate website language</label>
    <select id="pledge-language-select" value={language} onChange={event => changeLanguage(event.target.value)}
      className={`max-w-[170px] rounded-xl border px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-400 sm:max-w-[210px] sm:text-sm ${dark ? 'border-slate-700 bg-[#071525] text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
      aria-label="Translate entire website">
      {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
    </select>
    <div id="pledge-google-translate" className="hidden" aria-hidden="true" />
  </div>;
}
