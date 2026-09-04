import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Download,
  Code2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Columns,
  Maximize2,
  ListFilter,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Info,
  Cpu,
  Terminal,
  FileText
} from 'lucide-react';
import { DebugAnalysisResult, ExplanationLanguage, CodeIssue } from '../types';
import { highlightCode } from '../utils/prismHelper';

interface ResultsSectionProps {
  result: DebugAnalysisResult;
  originalCode: string;
  explanationLanguage: ExplanationLanguage;
  onLanguageToggle: (lang: ExplanationLanguage) => void;
  onAskQuestion: (question: string) => void;
  filename?: string | null;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  result,
  originalCode,
  explanationLanguage,
  onLanguageToggle,
  onAskQuestion,
  filename,
}) => {
  const [activeView, setActiveView] = useState<'split' | 'fixedOnly' | 'breakdown'>('split');
  const [copiedFixed, setCopiedFixed] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Set of lines that have issues in original code
  const issueLinesMap = new Map<number, CodeIssue>();
  result.issues.forEach((issue) => {
    if (issue.lineNumber) {
      issueLinesMap.set(issue.lineNumber, issue);
    }
  });

  const originalLines = originalCode.split('\n');
  const fixedLines = result.fixedCode.split('\n');

  // Copy full fixed code
  const handleCopyFixed = () => {
    navigator.clipboard.writeText(result.fixedCode);
    setCopiedFixed(true);
    setTimeout(() => setCopiedFixed(false), 2000);
  };

  // Download fixed file
  const handleDownloadFixed = () => {
    const ext = filename ? filename.split('.').pop() : result.detectedLanguage;
    const base = filename ? filename.replace(/\.[^/.]+$/, '') : 'code';
    const downloadName = `${base}.fixed.${ext}`;

    const blob = new Blob([result.fixedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy formatted markdown bug report
  const handleCopyReport = () => {
    const report = `# DamonFix Diagnostic Report
**Language:** ${result.languageDisplayName}
**Issues Found:** ${result.summary.totalIssues} (Errors: ${result.summary.errorsCount}, Warnings: ${result.summary.warningsCount})
**Fixes Applied:** ${result.summary.fixesAppliedCount}
**Code Health:** ${result.summary.healthScoreBefore}% → ${result.summary.healthScoreAfter}%

## Issues Breakdown:
${result.issues
  .map(
    (issue, i) => `### ${i + 1}. Line ${issue.lineNumber}: ${issue.title} [${issue.severity.toUpperCase()}]
- **Diagnostic:** ${issue.simpleExplanation}
- **Root Cause:** ${issue.whyItWasWrong}
- **Applied Patch:** ${issue.fixApplied}
`
  )
  .join('\n')}

## Principles & Student Takeaways:
${result.learningTakeaways.map((point) => `- ${point}`).join('\n')}

## Fixed Solution:
\`\`\`${result.detectedLanguage}
${result.fixedCode}
\`\`\`
`;
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <section id="results-section" className="space-y-6 scroll-mt-24 transition-all">
      {/* 1. TOP DIAGNOSTIC TELEMETRY RIBBON */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Metric Cards */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Issues Found</span>
                <span className="text-sm font-mono font-bold text-rose-200">{result.summary.totalIssues} Detected</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Warnings</span>
                <span className="text-sm font-mono font-bold text-amber-200">{result.summary.warningsCount} Warnings</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Fixes Applied</span>
                <span className="text-sm font-mono font-bold text-emerald-200">{result.summary.fixesAppliedCount} Patched</span>
              </div>
            </div>

            {/* Health Score Pill */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Code Health</span>
                <span className="text-sm font-mono font-bold text-cyan-200">
                  {result.summary.healthScoreBefore}% → <span className="text-emerald-400">{result.summary.healthScoreAfter}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Export & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="copy-fixed-code-btn"
              type="button"
              onClick={handleCopyFixed}
              className="h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {copiedFixed ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFixed ? 'Copied Fixed Code' : 'Copy Fixed Code'}</span>
            </button>

            <button
              id="download-fixed-code-btn"
              type="button"
              onClick={handleDownloadFixed}
              className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium border border-slate-800 transition-all cursor-pointer inline-flex items-center gap-2"
              title="Download fixed file with original extension"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              id="copy-bug-report-btn"
              type="button"
              onClick={handleCopyReport}
              className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-medium border border-slate-800 transition-all cursor-pointer inline-flex items-center gap-2"
              title="Copy markdown study report for student assignments"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileText className="w-3.5 h-3.5 text-indigo-400" />}
              <span className="hidden sm:inline">{copiedReport ? 'Report Copied' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {/* General Verdict Banner & Engine Badge */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {result.generalVerdict ? (
            <div className="flex items-start gap-2 text-xs text-slate-300 flex-1 min-w-[280px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">
                <span className="font-semibold text-white">Diagnostic Summary: </span>
                {result.generalVerdict}
              </p>
            </div>
          ) : <div />}

          {result.aiProviderUsed && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DIAGNOSTIC ENGINE:</span>
              <span className="text-cyan-300 font-semibold">{result.aiProviderUsed}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. VIEW TOGGLE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
        <div className="flex items-center h-9 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            id="view-split-btn"
            type="button"
            onClick={() => setActiveView('split')}
            className={`h-7.5 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'split'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-cyan-400" />
            <span>Split View</span>
          </button>
          <button
            id="view-fixed-only-btn"
            type="button"
            onClick={() => setActiveView('fixedOnly')}
            className={`h-7.5 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'fixedOnly'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fixed Code Only</span>
          </button>
          <button
            id="view-breakdown-btn"
            type="button"
            onClick={() => setActiveView('breakdown')}
            className={`h-7.5 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeView === 'breakdown'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Error Breakdown ({result.issues.length})</span>
          </button>
        </div>

        {/* Explanation language toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">Explanations in:</span>
          <div className="flex items-center h-8 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => onLanguageToggle('english')}
              className={`h-6.5 px-2.5 rounded-md text-xs font-medium cursor-pointer ${
                explanationLanguage === 'english'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageToggle('taglish')}
              className={`h-6.5 px-2.5 rounded-md text-xs font-medium cursor-pointer ${
                explanationLanguage === 'taglish'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Taglish
            </button>
          </div>
        </div>
      </div>

      {/* 3. CODE PANELS */}
      {activeView === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: ORIGINAL CODE WITH ERRORS HIGHLIGHTED */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="px-4 py-2.5 bg-[#090D16] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-mono font-semibold text-rose-400">
                  Original Source (Bugs Highlighted)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">{result.languageDisplayName}</span>
            </div>

            {/* Code Lines with highlight */}
            <div className="p-3 font-mono text-[13px] overflow-x-auto max-h-[550px] overflow-y-auto leading-6 selection:bg-rose-500/20">
              {originalLines.map((lineText, idx) => {
                const lineNum = idx + 1;
                const issue = issueLinesMap.get(lineNum);

                return (
                  <div
                    key={lineNum}
                    className={`flex items-start rounded px-1 transition-colors ${
                      issue
                        ? 'bg-rose-950/30 border-l-2 border-rose-500 text-rose-100 hover:bg-rose-950/50'
                        : 'hover:bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    {/* Line number */}
                    <span
                      className={`w-8 shrink-0 select-none text-right pr-3 font-mono ${
                        issue ? 'text-rose-400 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {lineNum}
                    </span>

                    {/* Code content */}
                    <span className="flex-1 whitespace-pre">{lineText || ' '}</span>

                    {/* Error tag if issue present */}
                    {issue && (
                      <span
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="ml-2 shrink-0 select-none text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-600/70 hover:bg-rose-600 text-white cursor-pointer shadow-sm"
                        title={issue.simpleExplanation}
                      >
                        Line {lineNum} Issue
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: FIXED CODE */}
          <div className="bg-[#0B0F19] border border-emerald-900/40 rounded-xl overflow-hidden shadow-lg flex flex-col ring-1 ring-emerald-500/10">
            <div className="px-4 py-2.5 bg-[#090D16] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  Fixed Solution (Ready to Run)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyFixed}
                className="text-xs font-mono text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedFixed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFixed ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code lines */}
            <div className="p-3 font-mono text-[13px] overflow-x-auto max-h-[550px] overflow-y-auto leading-6 selection:bg-emerald-500/20">
              {fixedLines.map((lineText, idx) => {
                const lineNum = idx + 1;
                return (
                  <div key={lineNum} className="flex items-start hover:bg-slate-900/40 px-1 rounded transition-colors">
                    <span className="w-8 shrink-0 select-none text-right pr-3 text-slate-600 font-mono">{lineNum}</span>
                    <span className="flex-1 whitespace-pre text-emerald-100/90">{lineText || ' '}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FIXED CODE ONLY VIEW */}
      {activeView === 'fixedOnly' && (
        <div className="bg-[#0B0F19] border border-emerald-900/40 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-[#090D16] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-semibold text-emerald-300">Complete Corrected Code</span>
              <span className="text-[11px] font-mono text-slate-500">({fixedLines.length} lines)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFixed}
                className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-medium cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedFixed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFixed ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadFixed}
                className="h-8 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <pre className="p-4 sm:p-5 font-mono text-xs sm:text-[13px] overflow-x-auto text-emerald-100/95 leading-6 max-h-[600px] overflow-y-auto">
            {result.fixedCode}
          </pre>
        </div>
      )}

      {/* 4. DETAILED BREAKDOWN PER ERROR */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
              Diagnostic Log & Error Analysis
            </h3>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {result.issues.length} {result.issues.length === 1 ? 'Defect' : 'Defects'}
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Language: <span className="text-cyan-300">{explanationLanguage === 'taglish' ? 'Taglish' : 'English'}</span>
          </span>
        </div>

        {result.issues.length === 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-6 text-center text-emerald-300">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-semibold text-sm">No Compile or Runtime Errors Detected</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">Your code is structurally sound and ready to execute.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.issues.map((issue, index) => {
              const isSelected = selectedIssueId === issue.id;

              return (
                <div
                  key={issue.id || index}
                  id={`issue-card-${issue.lineNumber}`}
                  className={`bg-[#0F172A] border rounded-xl p-4 shadow-md transition-all ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Issue Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 font-mono font-bold text-xs border border-rose-500/30">
                        {index + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-semibold text-white tracking-tight">{issue.title}</h4>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                        Line {issue.lineNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                        issue.severity === 'error' || issue.severity === 'syntax'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : issue.severity === 'logic' || issue.severity === 'runtime'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>

                  {/* Explanation in Simple Words */}
                  <div className="mb-3 bg-[#0B0F19] rounded-lg p-3 border border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Diagnostic Summary:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {issue.simpleExplanation}
                    </p>
                  </div>

                  {/* WHY IT WAS WRONG (Student Learning Pillar) */}
                  <div className="mb-3 bg-indigo-950/20 rounded-lg p-3 border border-indigo-900/30">
                    <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Root Cause Analysis:
                    </span>
                    <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed font-sans">
                      {issue.whyItWasWrong}
                    </p>
                  </div>

                  {/* Fix Applied */}
                  <div className="bg-emerald-950/20 rounded-lg p-3 border border-emerald-900/30">
                    <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Applied Fix & Patch:
                    </span>
                    <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed mb-2 font-sans">
                      {issue.fixApplied}
                    </p>

                    {/* Diff snippet if available */}
                    {(issue.originalSnippet || issue.fixedSnippet) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        {issue.originalSnippet && (
                          <div className="bg-rose-950/30 border border-rose-900/40 p-2 rounded text-rose-200">
                            <span className="text-[10px] text-rose-400 uppercase block font-mono font-medium mb-0.5">
                              Before (Buggy):
                            </span>
                            <pre className="whitespace-pre-wrap">{issue.originalSnippet}</pre>
                          </div>
                        )}
                        {issue.fixedSnippet && (
                          <div className="bg-emerald-950/30 border border-emerald-900/40 p-2 rounded text-emerald-200">
                            <span className="text-[10px] text-emerald-400 uppercase block font-mono font-medium mb-0.5">
                              After (Fixed):
                            </span>
                            <pre className="whitespace-pre-wrap">{issue.fixedSnippet}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ask Tutor specific question about this bug */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">Questions about line {issue.lineNumber}?</span>
                      <button
                        type="button"
                        onClick={() =>
                          onAskQuestion(
                            explanationLanguage === 'taglish'
                              ? `Bakit nagka-error sa Line ${issue.lineNumber} (${issue.title})? Pakipaliwanag nang mas detalyado at paano maiiwasan.`
                              : `Can you explain the Line ${issue.lineNumber} bug (${issue.title}) in more detail and how to prevent it?`
                          )
                        }
                        className="h-7.5 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-medium border border-slate-700/80 transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ask Damon About Line {issue.lineNumber}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. STUDENT LEARNING TAKEAWAYS */}
      {result.learningTakeaways && result.learningTakeaways.length > 0 && (
        <div className="bg-[#0F172A] border border-indigo-500/20 rounded-xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold font-mono text-white">
              Engineering Takeaways & Exam Principles
            </h3>
          </div>
          <p className="text-xs font-mono text-slate-400 mb-3.5">
            Core CS rules to memorize for lab activities and technical interviews:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {result.learningTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 flex items-start gap-2.5 text-xs text-slate-300"
              >
                <span className="w-4 h-4 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-sans">{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE STUDENT TUTOR CHAT PROMPT */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center border border-slate-800 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-mono">Follow-up with Damon Tutor</h4>
            <p className="text-xs text-slate-400 font-sans">
              Ask Damon about algorithm optimization, time complexity, or how to run this code locally.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              onAskQuestion(
                explanationLanguage === 'taglish'
                  ? 'Paano ko ito patatakbuhin sa computer ko step by step?'
                  : 'How do I run and test this code step-by-step in my IDE?'
              )
            }
            className="h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium border border-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>{explanationLanguage === 'taglish' ? 'Paano patakbuhin?' : 'How to run locally'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onAskQuestion(
                explanationLanguage === 'taglish'
                  ? 'Bakit kailangan ng fix na ito at may mas madali bang paraan?'
                  : 'Can you explain the fix in even simpler terms with an analogy?'
              )
            }
            className="h-8 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-medium border border-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span>{explanationLanguage === 'taglish' ? 'Mas simpleng paliwanag' : 'Simpler explanation'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
