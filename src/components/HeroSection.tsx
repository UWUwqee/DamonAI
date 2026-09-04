import React from 'react';
import { Terminal, ShieldCheck, Zap, BookOpen, Bug, CheckCircle2, ArrowRight } from 'lucide-react';
import { ExplanationLanguage } from '../types';

interface HeroSectionProps {
  explanationLanguage: ExplanationLanguage;
  onSelectSample?: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ explanationLanguage, onSelectSample }) => {
  return (
    <section className="relative pt-4 pb-6 md:pt-6 md:pb-8">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* IDE Terminal Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">ENGINE:</span>
          <span className="text-cyan-300 font-medium">READY</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">TUTOR:</span>
          <span className="text-indigo-300 font-medium">DAMON ONLINE</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mb-3">
          Universal Code Debugger{' '}
          <span className="text-cyan-400">&</span>{' '}
          <span className="text-slate-300 font-sans font-semibold">
            Engineering Tutor
          </span>
        </h1>

        {/* Dynamic subtext */}
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed font-sans">
          {explanationLanguage === 'taglish' ? (
            <span>
              Wala nang magdamagang puyatan sa compiler errors o runtime crashes. Mag-upload ng code file o i-paste ang code — aayusin ito nang kusa na may side-by-side patch at simpleng paliwanag sa{' '}
              <span className="text-amber-400 font-semibold">Taglish</span> para matutunan ang tamang konsepto.
            </span>
          ) : (
            <span>
              Stop spending hours hunting down off-by-one errors, memory leaks, and compiler issues. Drop in any code file or paste directly — get instant language detection, side-by-side diffs, and pedagogical explanations in clear{' '}
              <span className="text-cyan-400 font-semibold">English</span>.
            </span>
          )}
        </p>

        {/* Quick Clickable Sample Bug Chips */}
        {onSelectSample && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5">
            <span className="text-xs font-mono text-slate-400 mr-1 inline-flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Presets:</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectSample('python-calc')}
              className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Python Bounds</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('java-array')}
              className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-orange-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>Java ArrayMax</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('cpp-pointer')}
              className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-indigo-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>C++ Pointer</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('js-cart')}
              className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-amber-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>JS Assignment</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSample('sql-query')}
              className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>SQL GroupBy</span>
            </button>
          </div>
        )}

        {/* Value props badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono text-slate-400">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>25+ Programming Languages</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80">
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Syntax & Logic Detection</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Side-by-Side Patching</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800/80">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Root Cause Explanations</span>
          </div>
        </div>
      </div>
    </section>
  );
};
