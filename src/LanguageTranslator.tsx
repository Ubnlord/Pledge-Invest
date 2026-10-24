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
  }, []);

  const changeLanguage = (code: string) => {
    setLanguage(code);
    try { localStorage.setItem('pledge-site-language', code); } catch {}
    if (code === 'en') {
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (combo) {
        combo.value = '';
        combo.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    const initialize = () => {
      const GoogleTranslate = window.google?.translate?.TranslateElement;
      if (!GoogleTranslate) return false;
      const container = document.getElementById('pledge-google-translate');
      if (!container) return false;
      if (container.dataset.ready !== 'true') {
        new GoogleTranslate({
          pageLanguage: 'en',
          includedLanguages: 'en,es,fr,it,pt,nl,zh-CN,zh-TW,hi',
          autoDisplay: false,
        }, 'pledge-google-translate');
        container.dataset.ready = 'true';
      }
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (!combo) return false;
      combo.value = code;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };

    if (initialize()) return;
    window.googleTranslateElementInit = initialize;
    const existing = document.querySelector<HTMLScriptElement>('script[data-pledge-google-translate]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.pledgeGoogleTranslate = 'true';
      script.onerror = () => { script.remove(); };
      document.head.appendChild(script);
    } else {
      const retry = () => { initialize(); };
      existing.addEventListener('load', retry, { once: true });
    }
  };

  return <div className="relative flex items-center gap-2">
    <label htmlFor="pledge-language-select" className="sr-only">Translate website language</label>
    <select id="pledge-language-select" value={language} onChange={event => changeLanguage(event.target.value)}
      className={`max-w-[120px] rounded-xl border px-2 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-cyan-400 sm:max-w-[210px] sm:px-3 sm:py-2 sm:text-sm ${dark ? 'border-slate-700 bg-[#071525] text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
      aria-label="Translate entire website">
      {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
    </select>
    <div id="pledge-google-translate" className="hidden" aria-hidden="true" />
  </div>;
}
