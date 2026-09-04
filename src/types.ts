export type ExplanationLanguage = 'english' | 'taglish';

export type IssueSeverity = 'error' | 'warning' | 'syntax' | 'logic' | 'runtime' | 'best-practice';

export interface CodeIssue {
  id: string;
  lineNumber: number;
  endLineNumber?: number;
  severity: IssueSeverity;
  title: string;
  simpleExplanation: string;
  whyItWasWrong: string;
  fixApplied: string;
  originalSnippet?: string;
  fixedSnippet?: string;
}

export interface AnalysisSummary {
  totalIssues: number;
  errorsCount: number;
  warningsCount: number;
  fixesAppliedCount: number;
  healthScoreBefore: number;
  healthScoreAfter: number;
}

export interface DebugAnalysisResult {
  detectedLanguage: string;
  languageDisplayName: string;
  summary: AnalysisSummary;
  issues: CodeIssue[];
  fixedCode: string;
  learningTakeaways: string[];
  explanationLanguage: ExplanationLanguage;
  generalVerdict: string;
  aiProviderUsed?: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  model: string;
  isFree: boolean;
  description: string;
  freeKeyUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SampleSnippet {
  id: string;
  title: string;
  language: string;
  category: string;
  code: string;
  description: string;
}
