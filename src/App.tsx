/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CodeInputSection } from './components/CodeInputSection';
import { ResultsSection } from './components/ResultsSection';
import { StudentAssistantDrawer } from './components/StudentAssistantDrawer';
import { SAMPLE_SNIPPETS } from './data/samples';
import { detectLanguageFromCode } from './utils/languageDetector';
import { DebugAnalysisResult, ExplanationLanguage } from './types';
import { AlertCircle, Heart } from 'lucide-react';

export default function App() {
  // Start with default student sample
  const defaultSample = SAMPLE_SNIPPETS[0];
  const [code, setCode] = useState<string>(defaultSample.code);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('python');
  const [explanationLanguage, setExplanationLanguage] = useState<ExplanationLanguage>('english');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DebugAnalysisResult | null>(null);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [assistantQuestionTrigger, setAssistantQuestionTrigger] = useState<string | undefined>(undefined);

  // Real-time language detection as code changes
  useEffect(() => {
    if (selectedLanguage === 'auto') {
      const detected = detectLanguageFromCode(code);
      setDetectedLanguage(detected);
    } else {
      setDetectedLanguage(selectedLanguage);
    }
  }, [code, selectedLanguage]);

  // Analyze & Fix Code Handler
  const handleAnalyze = async (langOverride?: ExplanationLanguage) => {
    const langToUse = langOverride || explanationLanguage;
    if (!code.trim()) {
      setErrorAlert('Please paste or upload some code before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setErrorAlert(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: selectedLanguage === 'auto' ? detectedLanguage : selectedLanguage,
          filename: uploadedFileName,
          explanationLanguage: langToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: DebugAnalysisResult = await response.json();
      setAnalysisResult(data);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Analyze error:', err);
      setErrorAlert(err.message || 'Failed to analyze code. Please check your connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle English / Taglish
  const handleLanguageToggle = (newLang: ExplanationLanguage) => {
    setExplanationLanguage(newLang);
    // If we already have results, seamlessly re-analyze in the requested language
    if (analysisResult) {
      handleAnalyze(newLang);
    }
  };

  // Clear Code & Results
  const handleClear = () => {
    setCode('');
    setUploadedFileName(null);
    setAnalysisResult(null);
    setErrorAlert(null);
  };

  // Copy Result / Code
  const handleCopyResult = () => {
    const textToCopy = analysisResult ? analysisResult.fixedCode : code;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  // Select a preset sample snippet
  const handleSelectSample = (sampleId: string) => {
    const found = SAMPLE_SNIPPETS.find((s) => s.id === sampleId);
    if (found) {
      setCode(found.code);
      setSelectedLanguage(found.language);
      setUploadedFileName(null);
      setAnalysisResult(null);
      setErrorAlert(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Global Navigation Bar */}
      <Navbar
        explanationLanguage={explanationLanguage}
        onLanguageChange={handleLanguageToggle}
        onSelectSample={handleSelectSample}
        samples={SAMPLE_SNIPPETS.map((s) => ({ id: s.id, title: s.title, language: s.language }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert Banner */}
        {errorAlert && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorAlert(null)}
              className="text-rose-400 hover:text-rose-200 px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. Hero Section */}
        <HeroSection
          explanationLanguage={explanationLanguage}
          onSelectSample={handleSelectSample}
        />

        {/* 3. Code Input & File Upload Section */}
        <CodeInputSection
          code={code}
          setCode={setCode}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          detectedLanguage={detectedLanguage}
          explanationLanguage={explanationLanguage}
          onLanguageToggle={handleLanguageToggle}
          onAnalyze={() => handleAnalyze()}
          onClear={handleClear}
          isAnalyzing={isAnalyzing}
          hasResult={!!analysisResult}
          onCopyResult={handleCopyResult}
          copiedResult={copiedResult}
          uploadedFileName={uploadedFileName}
          setUploadedFileName={setUploadedFileName}
          onSelectSample={handleSelectSample}
        />

        {/* 4. Results Section (Appears after analysis) */}
        {analysisResult && (
          <ResultsSection
            result={analysisResult}
            originalCode={code}
            explanationLanguage={explanationLanguage}
            onLanguageToggle={handleLanguageToggle}
            onAskQuestion={(q) => setAssistantQuestionTrigger(q)}
            filename={uploadedFileName}
          />
        )}

        {/* 5. Student AI Assistant Drawer (Chat with DamonFix AI) */}
        <div className="mt-10">
          <StudentAssistantDrawer
            originalCode={code}
            fixedCode={analysisResult ? analysisResult.fixedCode : ''}
            explanationLanguage={explanationLanguage}
            initialQuestion={assistantQuestionTrigger}
            onClearInitialQuestion={() => setAssistantQuestionTrigger(undefined)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090D16] py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-slate-300">DamonFix</span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-[11px] text-slate-400">Universal Static & Runtime Diagnostic Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Damon Tutor Engine: Online</span>
            </div>
            <span>v2.4.0-it</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
