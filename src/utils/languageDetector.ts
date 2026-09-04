export interface LanguageInfo {
  id: string;
  name: string;
  extension: string;
  prismLang: string;
  color: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageInfo> = {
  python: { id: 'python', name: 'Python', extension: '.py', prismLang: 'python', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  java: { id: 'java', name: 'Java', extension: '.java', prismLang: 'java', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  javascript: { id: 'javascript', name: 'JavaScript', extension: '.js', prismLang: 'javascript', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  typescript: { id: 'typescript', name: 'TypeScript', extension: '.ts', prismLang: 'typescript', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  cpp: { id: 'cpp', name: 'C++', extension: '.cpp', prismLang: 'cpp', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  c: { id: 'c', name: 'C', extension: '.c', prismLang: 'c', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  csharp: { id: 'csharp', name: 'C#', extension: '.cs', prismLang: 'csharp', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  html: { id: 'html', name: 'HTML', extension: '.html', prismLang: 'html', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  css: { id: 'css', name: 'CSS', extension: '.css', prismLang: 'css', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  sql: { id: 'sql', name: 'SQL', extension: '.sql', prismLang: 'sql', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  php: { id: 'php', name: 'PHP', extension: '.php', prismLang: 'php', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  go: { id: 'go', name: 'Go', extension: '.go', prismLang: 'go', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  rust: { id: 'rust', name: 'Rust', extension: '.rs', prismLang: 'rust', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  kotlin: { id: 'kotlin', name: 'Kotlin', extension: '.kt', prismLang: 'kotlin', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  dart: { id: 'dart', name: 'Dart', extension: '.dart', prismLang: 'dart', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  swift: { id: 'swift', name: 'Swift', extension: '.swift', prismLang: 'swift', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  ruby: { id: 'ruby', name: 'Ruby', extension: '.rb', prismLang: 'ruby', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  json: { id: 'json', name: 'JSON', extension: '.json', prismLang: 'json', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  yaml: { id: 'yaml', name: 'YAML', extension: '.yaml', prismLang: 'yaml', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  xml: { id: 'xml', name: 'XML', extension: '.xml', prismLang: 'xml', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  bash: { id: 'bash', name: 'Shell / Bash', extension: '.sh', prismLang: 'bash', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  powershell: { id: 'powershell', name: 'PowerShell', extension: '.ps1', prismLang: 'powershell', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  batch: { id: 'batch', name: 'Batch', extension: '.bat', prismLang: 'batch', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
};

export const EXTENSION_MAP: Record<string, string> = {
  py: 'python',
  pyw: 'python',
  java: 'java',
  class: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  h: 'c',
  c: 'c',
  cs: 'csharp',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'css',
  sass: 'css',
  sql: 'sql',
  php: 'php',
  go: 'go',
  rs: 'rust',
  kt: 'kotlin',
  kts: 'kotlin',
  dart: 'dart',
  swift: 'swift',
  rb: 'ruby',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  ps1: 'powershell',
  bat: 'batch',
  cmd: 'batch'
};

export function detectLanguageFromFilename(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase() || '';
    if (EXTENSION_MAP[ext]) {
      return EXTENSION_MAP[ext];
    }
  }
  return null;
}

export function detectLanguageFromCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return 'python'; // default for beginners

  // Check Shebang
  if (trimmed.startsWith('#!/usr/bin/env python') || trimmed.startsWith('#!/usr/bin/python')) return 'python';
  if (trimmed.startsWith('#!/usr/bin/env node') || trimmed.startsWith('#!/usr/bin/node')) return 'javascript';
  if (trimmed.startsWith('#!/usr/bin/env bash') || trimmed.startsWith('#!/bin/bash') || trimmed.startsWith('#!/bin/sh')) return 'bash';

  // Specific markers
  if (trimmed.startsWith('<?php')) return 'php';
  if (/^<!DOCTYPE html>/i.test(trimmed) || /<html[\s>]/i.test(trimmed) || /<\/div>|<\/p>|<\/body>/i.test(trimmed)) return 'html';
  if (/^(\s*[{[])[\s\S]*([}\]]\s*)$/.test(trimmed) && (trimmed.includes('":') || trimmed.includes('": '))) return 'json';

  // SQL markers
  if (/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i.test(trimmed)) return 'sql';

  // C / C++ markers
  if (/#include\s*<iostream>|#include\s*<vector>|#include\s*<string>|std::|cout\s*<<|cin\s*>>/i.test(trimmed)) return 'cpp';
  if (/#include\s*<stdio\.h>|#include\s*<stdlib\.h>|printf\s*\(|scanf\s*\(/i.test(trimmed)) return 'c';

  // C# markers
  if (/using\s+System(\.|\s*;)|Console\.WriteLine|namespace\s+[A-Za-z0-9_]+\s*\{/i.test(trimmed)) return 'csharp';

  // Java markers
  if (/public\s+class\s+[A-Za-z0-9_]+|System\.out\.println|public\s+static\s+void\s+main/i.test(trimmed)) return 'java';

  // Kotlin markers
  if (/fun\s+main\s*\(|println\s*\(|val\s+[A-Za-z0-9_]+\s*:\s*[A-Za-z0-9_]+|data\s+class\b/i.test(trimmed)) return 'kotlin';

  // Go markers
  if (/package\s+main|import\s+\(\s*"fmt"|func\s+main\s*\(\s*\)/i.test(trimmed)) return 'go';

  // Rust markers
  if (/fn\s+main\s*\(\s*\)|println!\s*\(|let\s+mut\s+|impl\s+[A-Za-z0-9_]+\s+for/i.test(trimmed)) return 'rust';

  // Dart markers
  if (/void\s+main\s*\(\s*\)\s*\{|Widget\s+build\s*\(BuildContext/i.test(trimmed)) return 'dart';

  // Swift markers
  if (/import\s+SwiftUI|import\s+UIKit|func\s+[A-Za-z0-9_]+\s*\(.*?\)\s*->|var\s+body:\s*some\s+View/i.test(trimmed)) return 'swift';

  // Python markers
  if (/def\s+[a-zA-Z0-9_]+\s*\(.*?\):|import\s+[a-zA-Z0-9_]+|from\s+[a-zA-Z0-9_]+\s+import|print\s*\(|elif\s+|if\s+__name__\s*==\s*['"]__main__['"]:/i.test(trimmed)) return 'python';

  // TypeScript / JavaScript markers
  if (/interface\s+[A-Z][a-zA-Z0-9_]+\s*\{|type\s+[A-Z][a-zA-Z0-9_]+\s*=|:\s*(string|number|boolean|any)\[\]/i.test(trimmed)) return 'typescript';
  if (/const\s+|let\s+|var\s+|console\.log|function\s+[a-zA-Z0-9_]+\s*\(|=>\s*\{/i.test(trimmed)) return 'javascript';

  // CSS markers
  if (/[a-zA-Z0-9_#-]+\s*\{\s*[a-zA-Z-]+:\s*[^;]+;\s*\}/i.test(trimmed)) return 'css';

  return 'python';
}
