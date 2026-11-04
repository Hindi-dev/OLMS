import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Type, ShieldCheck } from 'lucide-react';

export const Navbar = ({ onOpenKrutiDev }) => {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="bg-rajbhasha-navy text-white shadow-md border-b-4 border-rajbhasha-saffron sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Branding & National Emblem Motif */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
            <span className="text-xl font-bold text-amber-300">रा</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-wide text-white flex items-center gap-1.5">
                {t('appTitle')}
              </h1>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
                राजभाषा 2.0
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              {t('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Right Tools: Kruti Dev Converter, Language Toggle & System Status */}
        <div className="flex items-center space-x-3">
          
          {/* Kruti Dev Quick Tool */}
          <button
            onClick={onOpenKrutiDev}
            className="flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-md border border-white/15 transition-all shadow-sm"
            title="Convert legacy Kruti Dev 010 text to standard Unicode Devanagari"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium hidden md:inline">कृति देव कनवर्टर</span>
          </button>

          {/* Bilingual Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 text-xs bg-rajbhasha-saffron hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-md shadow transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>

          {/* Privacy & Offline status indicator */}
          <div className="flex items-center space-x-1 text-emerald-400 text-xs bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px] font-medium">100% Private & Local</span>
          </div>
        </div>

      </div>
    </header>
  );
};
