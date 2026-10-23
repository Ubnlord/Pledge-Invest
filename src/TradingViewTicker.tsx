import { useEffect, useRef } from 'react';

/** Scrolling live market tape powered by TradingView (shown on every page). */
export default function TradingViewTicker({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    el.appendChild(widget);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
        { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
        { proName: 'BINANCE:TRXUSDT', title: 'TRON' },
        { proName: 'BINANCE:SOLUSDT', title: 'Solana' },
        { proName: 'BINANCE:BNBUSDT', title: 'BNB' },
        { proName: 'BINANCE:XRPUSDT', title: 'XRP' },
        { proName: 'BINANCE:ADAUSDT', title: 'Cardano' },
        { proName: 'BINANCE:DOGEUSDT', title: 'Dogecoin' },
        { proName: 'BINANCE:AVAXUSDT', title: 'Avalanche' },
        { proName: 'BINANCE:LINKUSDT', title: 'Chainlink' },
      ],
      showSymbolLogo: true,
      colorTheme: theme,
      isTransparent: false,
      displayMode: 'adaptive',
      locale: 'en',
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = '';
    };
  }, [theme]);

  return (
    <div className="w-full border-b border-slate-800 bg-[#131722]">
      <div className="tradingview-widget-container" ref={containerRef} />
    </div>
  );
}
