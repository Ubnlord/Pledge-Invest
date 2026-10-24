import { useEffect, useState } from 'react';

const languages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'nl', label: '🇳🇱 Nederlands' },
  { code: 'zh-TW', label: '🇭🇰 Cantonese — 粵語' },
  { code: 'zh-CN', label: '🇨🇳 Mandarin — 普通话' },
  { code: 'hi', label: '🇮🇳 Hindi — हिन्दी' },
];

type Dictionary = Record<string, string>;
const dictionaries: Record<string, Dictionary> = {
  es: {
    'Login': 'Iniciar sesión', 'Log In': 'Iniciar sesión', 'Sign In': 'Iniciar sesión',
    'Create Account': 'Crear cuenta', 'Get Started': 'Comenzar', 'Learn More': 'Más información',
    'Home': 'Inicio', 'About Us': 'Sobre nosotros', 'About': 'Acerca de', 'Contact Us': 'Contáctanos',
    'Contact': 'Contacto', 'Our Plans': 'Nuestros planes', 'Investment Plans': 'Planes de inversión',
    'Why Choose Us': 'Por qué elegirnos', 'Testimonials': 'Testimonios', 'Frequently Asked Questions': 'Preguntas frecuentes',
    'Live Market': 'Mercado en vivo', 'Market Overview': 'Resumen del mercado', 'Loading...': 'Cargando...',
    'Loading': 'Cargando', 'Dashboard': 'Panel', 'Wallet': 'Cartera', 'Transactions': 'Transacciones',
    'Deposit': 'Depósito', 'Withdraw': 'Retirar', 'Invest Now': 'Invertir ahora', 'Start Investing': 'Comenzar a invertir',
    'Email': 'Correo electrónico', 'Password': 'Contraseña', 'Username': 'Nombre de usuario',
    'Full Name': 'Nombre completo', 'Phone': 'Teléfono', 'Country': 'País', 'Submit': 'Enviar',
    'Cancel': 'Cancelar', 'Save': 'Guardar', 'Back': 'Atrás', 'Next': 'Siguiente', 'Close': 'Cerrar',
    'Available Balance': 'Saldo disponible', 'Recent Transactions': 'Transacciones recientes',
    'Terms of Service': 'Términos del servicio', 'Privacy Policy': 'Política de privacidad',
  },
  fr: {
    'Login': 'Connexion', 'Log In': 'Connexion', 'Sign In': 'Se connecter',
    'Create Account': 'Créer un compte', 'Get Started': 'Commencer', 'Learn More': 'En savoir plus',
    'Home': 'Accueil', 'About Us': 'À propos', 'About': 'À propos', 'Contact Us': 'Nous contacter',
    'Contact': 'Contact', 'Our Plans': 'Nos offres', 'Investment Plans': 'Plans d’investissement',
    'Why Choose Us': 'Pourquoi nous choisir', 'Testimonials': 'Témoignages', 'Frequently Asked Questions': 'Questions fréquentes',
    'Live Market': 'Marché en direct', 'Market Overview': 'Aperçu du marché', 'Loading...': 'Chargement...',
    'Loading': 'Chargement', 'Dashboard': 'Tableau de bord', 'Wallet': 'Portefeuille', 'Transactions': 'Transactions',
    'Deposit': 'Dépôt', 'Withdraw': 'Retirer', 'Invest Now': 'Investir maintenant', 'Start Investing': 'Commencer à investir',
    'Email': 'E-mail', 'Password': 'Mot de passe', 'Username': 'Nom d’utilisateur',
    'Full Name': 'Nom complet', 'Phone': 'Téléphone', 'Country': 'Pays', 'Submit': 'Envoyer',
    'Cancel': 'Annuler', 'Save': 'Enregistrer', 'Back': 'Retour', 'Next': 'Suivant', 'Close': 'Fermer',
    'Available Balance': 'Solde disponible', 'Recent Transactions': 'Transactions récentes',
    'Terms of Service': 'Conditions d’utilisation', 'Privacy Policy': 'Politique de confidentialité',
  },
  it: {
    'Login': 'Accedi', 'Log In': 'Accedi', 'Sign In': 'Accedi', 'Create Account': 'Crea account',
    'Get Started': 'Inizia', 'Learn More': 'Scopri di più', 'Home': 'Home', 'About Us': 'Chi siamo',
    'About': 'Informazioni', 'Contact Us': 'Contattaci', 'Contact': 'Contatti', 'Our Plans': 'I nostri piani',
    'Investment Plans': 'Piani di investimento', 'Why Choose Us': 'Perché sceglierci', 'Testimonials': 'Testimonianze',
    'Frequently Asked Questions': 'Domande frequenti', 'Live Market': 'Mercato in tempo reale',
    'Market Overview': 'Panoramica del mercato', 'Loading...': 'Caricamento...', 'Loading': 'Caricamento',
    'Dashboard': 'Dashboard', 'Wallet': 'Portafoglio', 'Transactions': 'Transazioni', 'Deposit': 'Deposito',
    'Withdraw': 'Preleva', 'Invest Now': 'Investi ora', 'Start Investing': 'Inizia a investire',
    'Email': 'Email', 'Password': 'Password', 'Username': 'Nome utente', 'Full Name': 'Nome completo',
    'Phone': 'Telefono', 'Country': 'Paese', 'Submit': 'Invia', 'Cancel': 'Annulla', 'Save': 'Salva',
    'Back': 'Indietro', 'Next': 'Avanti', 'Close': 'Chiudi', 'Available Balance': 'Saldo disponibile',
    'Recent Transactions': 'Transazioni recenti', 'Terms of Service': 'Termini di servizio', 'Privacy Policy': 'Informativa sulla privacy',
  },
  pt: {
    'Login': 'Entrar', 'Log In': 'Entrar', 'Sign In': 'Iniciar sessão', 'Create Account': 'Criar conta',
    'Get Started': 'Começar', 'Learn More': 'Saiba mais', 'Home': 'Início', 'About Us': 'Sobre nós',
    'About': 'Sobre', 'Contact Us': 'Fale connosco', 'Contact': 'Contacto', 'Our Plans': 'Os nossos planos',
    'Investment Plans': 'Planos de investimento', 'Why Choose Us': 'Por que nos escolher', 'Testimonials': 'Depoimentos',
    'Frequently Asked Questions': 'Perguntas frequentes', 'Live Market': 'Mercado em tempo real',
    'Market Overview': 'Visão geral do mercado', 'Loading...': 'A carregar...', 'Loading': 'A carregar',
    'Dashboard': 'Painel', 'Wallet': 'Carteira', 'Transactions': 'Transações', 'Deposit': 'Depósito',
    'Withdraw': 'Levantar', 'Invest Now': 'Investir agora', 'Start Investing': 'Começar a investir',
    'Email': 'E-mail', 'Password': 'Palavra-passe', 'Username': 'Nome de utilizador', 'Full Name': 'Nome completo',
    'Phone': 'Telefone', 'Country': 'País', 'Submit': 'Enviar', 'Cancel': 'Cancelar', 'Save': 'Guardar',
    'Back': 'Voltar', 'Next': 'Seguinte', 'Close': 'Fechar', 'Available Balance': 'Saldo disponível',
    'Recent Transactions': 'Transações recentes', 'Terms of Service': 'Termos de serviço', 'Privacy Policy': 'Política de privacidade',
  },
  nl: {
    'Login': 'Inloggen', 'Log In': 'Inloggen', 'Sign In': 'Aanmelden', 'Create Account': 'Account aanmaken',
    'Get Started': 'Aan de slag', 'Learn More': 'Meer informatie', 'Home': 'Home', 'About Us': 'Over ons',
    'About': 'Over', 'Contact Us': 'Contact opnemen', 'Contact': 'Contact', 'Our Plans': 'Onze plannen',
    'Investment Plans': 'Beleggingsplannen', 'Why Choose Us': 'Waarom voor ons kiezen', 'Testimonials': 'Ervaringen',
    'Frequently Asked Questions': 'Veelgestelde vragen', 'Live Market': 'Live markt', 'Market Overview': 'Marktoverzicht',
    'Loading...': 'Laden...', 'Loading': 'Laden', 'Dashboard': 'Dashboard', 'Wallet': 'Wallet',
    'Transactions': 'Transacties', 'Deposit': 'Storten', 'Withdraw': 'Opnemen', 'Invest Now': 'Nu beleggen',
    'Start Investing': 'Begin met beleggen', 'Email': 'E-mail', 'Password': 'Wachtwoord', 'Username': 'Gebruikersnaam',
    'Full Name': 'Volledige naam', 'Phone': 'Telefoon', 'Country': 'Land', 'Submit': 'Verzenden',
    'Cancel': 'Annuleren', 'Save': 'Opslaan', 'Back': 'Terug', 'Next': 'Volgende', 'Close': 'Sluiten',
    'Available Balance': 'Beschikbaar saldo', 'Recent Transactions': 'Recente transacties',
    'Terms of Service': 'Servicevoorwaarden', 'Privacy Policy': 'Privacybeleid',
  },
  'zh-CN': {
    'Login': '登录', 'Log In': '登录', 'Sign In': '登录', 'Create Account': '创建账户',
    'Get Started': '立即开始', 'Learn More': '了解更多', 'Home': '首页', 'About Us': '关于我们',
    'About': '关于', 'Contact Us': '联系我们', 'Contact': '联系', 'Our Plans': '我们的计划',
    'Investment Plans': '投资计划', 'Why Choose Us': '为什么选择我们', 'Testimonials': '客户评价',
    'Frequently Asked Questions': '常见问题', 'Live Market': '实时市场', 'Market Overview': '市场概览',
    'Loading...': '加载中...', 'Loading': '加载中', 'Dashboard': '仪表板', 'Wallet': '钱包',
    'Transactions': '交易记录', 'Deposit': '存款', 'Withdraw': '提现', 'Invest Now': '立即投资',
    'Start Investing': '开始投资', 'Email': '电子邮箱', 'Password': '密码', 'Username': '用户名',
    'Full Name': '姓名', 'Phone': '电话', 'Country': '国家', 'Submit': '提交', 'Cancel': '取消',
    'Save': '保存', 'Back': '返回', 'Next': '下一步', 'Close': '关闭', 'Available Balance': '可用余额',
    'Recent Transactions': '最近交易', 'Terms of Service': '服务条款', 'Privacy Policy': '隐私政策',
  },
  'zh-TW': {
    'Login': '登入', 'Log In': '登入', 'Sign In': '登入', 'Create Account': '建立帳戶',
    'Get Started': '立即開始', 'Learn More': '了解更多', 'Home': '首頁', 'About Us': '關於我們',
    'About': '關於', 'Contact Us': '聯絡我們', 'Contact': '聯絡', 'Our Plans': '我們的方案',
    'Investment Plans': '投資方案', 'Why Choose Us': '為何選擇我們', 'Testimonials': '客戶評價',
    'Frequently Asked Questions': '常見問題', 'Live Market': '即時市場', 'Market Overview': '市場概覽',
    'Loading...': '載入中...', 'Loading': '載入中', 'Dashboard': '儀表板', 'Wallet': '錢包',
    'Transactions': '交易紀錄', 'Deposit': '存款', 'Withdraw': '提款', 'Invest Now': '立即投資',
    'Start Investing': '開始投資', 'Email': '電子郵件', 'Password': '密碼', 'Username': '使用者名稱',
    'Full Name': '姓名', 'Phone': '電話', 'Country': '國家', 'Submit': '提交', 'Cancel': '取消',
    'Save': '儲存', 'Back': '返回', 'Next': '下一步', 'Close': '關閉', 'Available Balance': '可用餘額',
    'Recent Transactions': '近期交易', 'Terms of Service': '服務條款', 'Privacy Policy': '隱私政策',
  },
  hi: {
    'Login': 'लॉग इन', 'Log In': 'लॉग इन', 'Sign In': 'साइन इन', 'Create Account': 'खाता बनाएं',
    'Get Started': 'शुरू करें', 'Learn More': 'और जानें', 'Home': 'होम', 'About Us': 'हमारे बारे में',
    'About': 'परिचय', 'Contact Us': 'संपर्क करें', 'Contact': 'संपर्क', 'Our Plans': 'हमारी योजनाएं',
    'Investment Plans': 'निवेश योजनाएं', 'Why Choose Us': 'हमें क्यों चुनें', 'Testimonials': 'प्रशंसापत्र',
    'Frequently Asked Questions': 'अक्सर पूछे जाने वाले प्रश्न', 'Live Market': 'लाइव बाजार',
    'Market Overview': 'बाजार का अवलोकन', 'Loading...': 'लोड हो रहा है...', 'Loading': 'लोड हो रहा है',
    'Dashboard': 'डैशबोर्ड', 'Wallet': 'वॉलेट', 'Transactions': 'लेन-देन', 'Deposit': 'जमा करें',
    'Withdraw': 'निकासी', 'Invest Now': 'अभी निवेश करें', 'Start Investing': 'निवेश शुरू करें',
    'Email': 'ईमेल', 'Password': 'पासवर्ड', 'Username': 'उपयोगकर्ता नाम', 'Full Name': 'पूरा नाम',
    'Phone': 'फ़ोन', 'Country': 'देश', 'Submit': 'जमा करें', 'Cancel': 'रद्द करें', 'Save': 'सहेजें',
    'Back': 'वापस', 'Next': 'अगला', 'Close': 'बंद करें', 'Available Balance': 'उपलब्ध शेष',
    'Recent Transactions': 'हाल के लेन-देन', 'Terms of Service': 'सेवा की शर्तें', 'Privacy Policy': 'गोपनीयता नीति',
  },
};

const dictionariesWithEnglish: Record<string, Dictionary> = dictionaries;
const reverseLookup = (dict: Dictionary, value: string) =>
  Object.keys(dict).find(key => dict[key] === value);

export default function LanguageTranslator({ dark = false }: { dark?: boolean }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge-site-language');
      if (saved && languages.some(item => item.code === saved)) setLanguage(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const dict = dictionariesWithEnglish[language] || {};
    const originals = new WeakMap<Text, string>();
    const translateText = (node: Text) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,noscript,textarea,input,select,option,[contenteditable="true"]')) return;
      const original = originals.get(node) ?? node.data;
      originals.set(node, original);
      const trimmed = original.trim();
      if (!trimmed) return;
      const translated = dict[trimmed] || reverseLookup(dict, trimmed) || trimmed;
      if (node.data !== original.replace(trimmed, translated)) {
        node.data = original.replace(trimmed, translated);
      }
    };
    const translateAttributes = (element: Element) => {
      for (const attr of ['placeholder', 'aria-label', 'title']) {
        const value = element.getAttribute(attr);
        if (!value) continue;
        const translated = dict[value] || reverseLookup(dict, value);
        if (translated && translated !== value) element.setAttribute(attr, translated);
      }
    };
    const translateTree = (root: ParentNode) => {
      root.querySelectorAll('*').forEach(el => translateAttributes(el));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) translateText(node as Text);
    };
    translateTree(document.body);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') translateText(record.target as Text);
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
          else if (node instanceof Element) {
            translateAttributes(node);
            translateTree(node);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  const changeLanguage = (code: string) => {
    setLanguage(code);
    try { localStorage.setItem('pledge-site-language', code); } catch {}
  };

  return <div className="relative flex items-center gap-2">
    <label htmlFor="pledge-language-select" className="sr-only">Website language</label>
    <select id="pledge-language-select" value={language} onChange={event => changeLanguage(event.target.value)}
      className={`max-w-[120px] rounded-xl border px-2 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-cyan-400 sm:max-w-[210px] sm:px-3 sm:py-2 sm:text-sm ${dark ? 'border-slate-700 bg-[#071525] text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
      aria-label="Website language">
      {languages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}
    </select>
  </div>;
}
