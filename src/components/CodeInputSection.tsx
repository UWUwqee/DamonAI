import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileCode,
  FileText,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  Code,
  Play,
  Terminal,
  Cpu,
  AlignLeft
} from 'lucide-react';
import { ExplanationLanguage } from '../types';
import {
  SUPPORTED_LANGUAGES,
  detectLanguageFromCode,
  detectLanguageFromFilename,
} from '../utils/languageDetector';

interface CodeInputSectionProps {
  code: string;
  setCode: (code: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  detectedLanguage: string;
  explanationLanguage: ExplanationLanguage;
  onLanguageToggle: (lang: ExplanationLanguage) => void;
  onAnalyze: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  onCopyResult: () => void;
  copiedResult: boolean;
  uploadedFileName: string | null;
  setUploadedFileName: (name: string | null) => void;
  onSelectSample: (id: string) => void;
}

export const CodeInputSection: React.FC<CodeInputSectionProps> = ({
  code,
  setCode,
  selectedLanguage,
  setSelectedLanguage,
  detectedLanguage,
  explanationLanguage,
  onLanguageToggle,
  onAnalyze,
  onClear,
  isAnalyzing,
  hasResult,
  onCopyResult,
  copiedResult,
  uploadedFileName,
  setUploadedFileName,
  onSelectSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'upload'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Compute line count
  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Support Tab key indentation inside textarea & Ctrl+Enter to trigger Analyze
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing && code.trim()) {
        onAnalyze();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + '    ' + val.substring(end);
      setCode(updated);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Quick code cleaner (trims whitespace lines, removes trailing spaces)
  const handleFormatCode = () => {
    if (!code) return;
    const formatted = code
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
    setCode(formatted);
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCode(content || '');
      setUploadedFileName(file.name);

      const langFromExt = detectLanguageFromFilename(file.name);
      if (langFromExt) {
        setSelectedLanguage(langFromExt);
      }
      setActiveTab('editor');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Active language info
  const langKey = selectedLanguage === 'auto' ? detectedLanguage : selectedLanguage;
  const currentLangInfo = SUPPORTED_LANGUAGES[langKey] || {
    id: langKey,
    name: langKey.toUpperCase(),
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <div id="code-input-card" className="bg-[#0F172A]/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm mb-8 transition-all">
      {/* IDE Window Title Bar & Workspace Tabs */}
      <div className="px-4 py-3 border-b border-slate-800/90 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Terminal Window Controls & Tabs */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mr-1 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              id="tab-editor-btn"
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`h-7.5 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>Editor</span>
            </button>
            <button
              id="tab-upload-btn"
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`h-7.5 px-3 rounded-md text-xs font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Right side: Language Selector & Auto-detect Badge */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Detected / Selected Language Badge & Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-mono text-slate-400">Target:</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${currentLangInfo.color}`}>
                {currentLangInfo.name}
              </span>
              {selectedLanguage === 'auto' && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Auto
                </span>
              )}
            </div>

            {/* Language dropdown override */}
            <select
              id="language-select-dropdown"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-300 border-none outline-none cursor-pointer hover:text-white pl-1"
            >
              <option value="auto" className="bg-slate-900 text-slate-200">
                Auto-detect
              </option>
              {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-slate-900 text-slate-200">
                  {lang.name} ({lang.extension})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Uploaded File Bar (if file loaded) */}
      {uploadedFileName && (
        <div className="bg-indigo-950/20 border-b border-indigo-900/30 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2 truncate font-mono">
            <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-white font-medium">{uploadedFileName}</span>
            <span className="text-slate-400">• Ready for diagnostic scan</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadedFileName(null)}
            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Remove file reference"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Body */}
      {activeTab === 'upload' ? (
        /* File Upload View */
        <div className="p-6 sm:p-10 bg-[#0B0F19]">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              id="file-upload-input"
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center mb-3 shadow-sm">
              <Upload className="w-6 h-6" />
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-white mb-1">
              Select or drop source code file
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed font-mono">
              Supported formats: .py, .java, .cpp, .c, .js, .ts, .sql, .html, .css, .php, .cs, .go, .rs, .kt, .sh
            </p>

            <button
              id="browse-files-btn"
              type="button"
              className="h-9 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium border border-slate-700 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browse Local Files</span>
            </button>
          </div>
        </div>
      ) : (
        /* Code Editor View */
        <div className="relative flex flex-col bg-[#0B0F19]">
          <div className="flex relative min-h-[320px] max-h-[520px]">
            {/* Line numbers gutter */}
            <div
              ref={lineNumbersRef}
              className="w-12 sm:w-14 py-3.5 pr-3 pl-2 select-none font-mono text-[13px] text-slate-600 text-right bg-[#090D16] border-r border-slate-800/80 overflow-hidden shrink-0 leading-6"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="h-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <div className="relative flex-1">
              <textarea
                id="code-editor-textarea"
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                placeholder={`// Paste source code here or select a quick preset above...
// DamonFix AI inspects syntax bugs, index bounds, and algorithmic errors.
// Press Ctrl + Enter to run diagnostics.`}
                spellCheck={false}
                className="w-full h-full min-h-[320px] max-h-[520px] p-3.5 bg-transparent text-slate-100 font-mono text-[13px] leading-6 resize-y focus:outline-none placeholder:text-slate-600 selection:bg-indigo-600/30 selection:text-white"
              />
            </div>
          </div>

          {/* Editor bottom status bar */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-[#090D16] flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400">{lineCount} lines</span>
              <span className="text-slate-700">•</span>
              <span className="font-mono text-slate-400">{code.length} chars</span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="hidden sm:inline font-mono text-slate-500">UTF-8</span>
              <span className="hidden md:inline text-slate-700">•</span>
              <button
                type="button"
                onClick={handleFormatCode}
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Trim trailing whitespace and standardize indentation"
              >
                <AlignLeft className="w-3 h-3 text-cyan-400" />
                <span>Format Whitespace</span>
              </button>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                <span>Ctrl + Enter</span>
                <span className="text-slate-500">to execute</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Footer - Unified Height and Clean Alignment */}
      <div className="p-3.5 sm:p-4 bg-[#0B0F19] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Analyze & Fix Button */}
          <button
            id="analyze-and-fix-btn"
            type="button"
            disabled={isAnalyzing || !code.trim()}
            onClick={onAnalyze}
            className={`h-10 px-5 rounded-lg font-mono font-medium text-xs tracking-wide transition-all shadow-sm cursor-pointer inline-flex items-center gap-2 ${
              isAnalyzing || !code.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-[0.98]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Analyzing & Fixing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-cyan-300" />
                <span>Analyze & Fix Code</span>
              </>
            )}
          </button>

          {/* Clear Button */}
          <button
            id="clear-code-btn"
            type="button"
            onClick={onClear}
            disabled={isAnalyzing || (!code && !hasResult)}
            className={`h-10 px-3.5 rounded-lg font-mono text-xs transition-all border cursor-pointer inline-flex items-center gap-1.5 ${
              !code && !hasResult
                ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border-slate-800 hover:border-rose-900/50'
            }`}
            title="Clear buffer and reset"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Buffer</span>
          </button>
        </div>

        {/* Copy Result / Code Button */}
        <div className="flex items-center gap-2">
          <button
            id="copy-result-btn"
            type="button"
            onClick={onCopyResult}
            disabled={!code.trim() && !hasResult}
            className={`h-10 px-3.5 rounded-lg font-mono text-xs transition-all border cursor-pointer inline-flex items-center gap-1.5 ${
              !code.trim() && !hasResult
                ? 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700 shadow-sm'
            }`}
            title="Copy current code or results"
          >
            {copiedResult ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
