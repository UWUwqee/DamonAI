import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Globe2, Code2, ChevronDown, Check, Sparkles, Activity } from 'lucide-react';
import { ExplanationLanguage } from '../types';

interface NavbarProps {
  explanationLanguage: ExplanationLanguage;
  onLanguageChange: (lang: ExplanationLanguage) => void;
  onSelectSample: (id: string) => void;
  samples: Array<{ id: string; title: string; language: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  explanationLanguage,
  onLanguageChange,
  onSelectSample,
  samples,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10 ring-1 ring-cyan-500/20">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-mono font-bold tracking-tight text-white flex items-center">
                DamonFix<span className="text-cyan-400">.ai</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-cyan-950/40 text-cyan-400 border border-cyan-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                IDE v2.5
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Universal Code Debugger & Engineering Tutor
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Sample Code Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="samples-dropdown-btn"
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-mono font-medium text-slate-300 bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Load Sample Bug</span>
              <span className="sm:hidden">Samples</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0F172A] border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-mono font-medium text-slate-400 px-2.5 py-1.5 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 mb-1">
                  <span>Student Bug Presets</span>
                  <span className="text-cyan-400 font-semibold">{samples.length} Ready</span>
                </div>
                <div className="space-y-0.5">
                  {samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        onSelectSample(sample.id);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <span className="truncate pr-2 font-sans group-hover:text-cyan-300 transition-colors">
                        {sample.title}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 shrink-0">
                        {sample.language}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle: English | Taglish */}
          <div className="flex items-center h-9 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-[11px] font-mono text-slate-400 px-2 hidden md:inline-flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Language:</span>
            </span>
            <button
              id="toggle-lang-english"
              type="button"
              onClick={() => onLanguageChange('english')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1 ${
                explanationLanguage === 'english'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>English</span>
            </button>
            <button
              id="toggle-lang-taglish"
              type="button"
              onClick={() => onLanguageChange('taglish')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1 ${
                explanationLanguage === 'taglish'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>Taglish</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
