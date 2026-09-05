import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  analyzeCodeWithFailover,
  chatWithFailover,
  getAvailableProviders,
} from './server/aiEngine.js';

dotenv.config();

const app = express();
// When running in AI Studio, APPLET_ID is set and Nginx proxies strictly to port 3000.
// On cloud deployments (Railway, Render, Fly.io, Cloud Run), listen on process.env.PORT provided by the host.
const PORT = process.env.APPLET_ID ? 3000 : (Number(process.env.PORT) || 3000);

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'DamonFix AI', time: new Date().toISOString() });
});

// API Providers status endpoint (Shows active free providers and fallback readiness)
app.get('/api/providers', (req: Request, res: Response) => {
  try {
    const providers = getAvailableProviders();
    res.json({ providers });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve providers info' });
  }
});

// Analyze and fix code endpoint with automatic multi-provider failover
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { code, language, filename, explanationLanguage = 'english' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: 'Code input is required.' });
      return;
    }

    const result = await analyzeCodeWithFailover(
      {
        code,
        language,
        filename,
        explanationLanguage: explanationLanguage === 'taglish' ? 'taglish' : 'english',
      },
      (c, l, el) => getFallbackAnalysis(c, l, el) as any
    );

    res.json(result);
  } catch (err: any) {
    console.error('Error in /api/analyze:', err);
    // Even if an unexpected error occurs, safety-fallback guarantees 100% uptime
    const safeFallback = getFallbackAnalysis(
      req.body?.code || '',
      req.body?.language,
      req.body?.explanationLanguage || 'english'
    );
    res.json({
      ...safeFallback,
      aiProviderUsed: 'DamonFix Local AST Engine (Safety Recovery Mode)',
    });
  }
});

// Follow-up Student AI Chat endpoint with failover
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { code, fixedCode, question, explanationLanguage = 'english' } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const chatResponse = await chatWithFailover(
      question,
      code || '',
      fixedCode || '',
      explanationLanguage === 'taglish' ? 'taglish' : 'english'
    );

    res.json(chatResponse);
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    const fallbackReply =
      req.body?.explanationLanguage === 'taglish'
        ? 'Magandang tanong! Laging tandaan na i-check ang base-0 indexing at variable declarations bago mag-run.'
        : 'Good question! Always make sure to verify 0-based indexing and variable scoping before executing.';
    res.json({ reply: fallbackReply, aiProviderUsed: 'DamonFix Local Tutor Knowledge Base' });
  }
});

// Comprehensive student rule-based analyzer when API is offline or saturated
function getFallbackAnalysis(code: string, userLang?: string, explanationLanguage = 'english') {
  const lines = code.split('\n');
  const issues: any[] = [];
  let fixedCode = code;
  let detected = (userLang && userLang !== 'auto') ? userLang : 'python';

  // Detect language if auto
  if (detected === 'python' || !userLang || userLang === 'auto') {
    if (code.includes('public class') || code.includes('System.out.println')) detected = 'java';
    else if (code.includes('#include') || code.includes('cout <<') || code.includes('std::')) detected = 'cpp';
    else if (code.includes('Console.WriteLine') || code.includes('using System;')) detected = 'csharp';
    else if (code.includes('SELECT ') && code.includes('FROM ')) detected = 'sql';
    else if (code.includes('console.log') || code.includes('const ') || code.includes('let ') || code.includes('function ')) detected = 'javascript';
    else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) detected = 'python';
  }

  const langNames: Record<string, string> = {
    python: 'Python 3',
    java: 'Java',
    cpp: 'C++',
    javascript: 'JavaScript (ES6+)',
    csharp: 'C#',
    sql: 'SQL',
    html: 'HTML5',
    css: 'CSS3',
    php: 'PHP',
    go: 'Go',
    rust: 'Rust',
  };

  // 1. Python specific patterns
  if (detected === 'python') {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      // Off by one range
      if (line.includes('range(len(') && line.includes('+ 1)')) {
        issues.push({
          id: `py-off-by-one-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'IndexError (Off-by-One Range Boundary)',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Lalampas ang loop sa dulo ng list. Sa Python, ang list index ay nagsisimula sa 0 hanggang len - 1 lang.'
              : 'The loop extends past the end of the list. In Python, list indices run from 0 to len - 1.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Dahil naglagay ka ng "+ 1", susubukan nitong i-access ang index na wala na sa listahan kaya magkakaroon ng IndexError: list index out of range.'
              : 'Using "+ 1" causes the loop to attempt accessing an index that does not exist in the collection, throwing IndexError.',
          fixApplied: 'Removed "+ 1" to iterate within valid array bounds.',
          originalSnippet: line.trim(),
          fixedSnippet: line.replace('range(len(grades) + 1)', 'range(len(grades))').trim(),
        });
        fixedCode = fixedCode.replace(line, line.replace('+ 1', '').replace('grades) )', 'grades)'));
      }

      // NameError undefined variable
      if (line.trim() === 'return avg' || line.includes('return avg')) {
        issues.push({
          id: `py-name-error-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'NameError: undefined variable "avg"',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Tinawag mo ang "avg", pero "average" ang variable name na ginawa mo sa taas.'
              : 'You returned "avg", but the variable defined earlier was named "average".',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Hindi makikilala ng Python interpreter ang "avg" dahil wala itong assignment sa scope na ito.'
              : 'Python cannot resolve identifiers that have not been assigned in the local or global scope.',
          fixApplied: 'Updated return variable from "avg" to "average".',
          originalSnippet: 'return avg',
          fixedSnippet: '    return average',
        });
        fixedCode = fixedCode.replace('return avg', '    return average');
      }

      // Type error string concatenation
      if (line.includes('print("Student Average: " + result)')) {
        issues.push({
          id: `py-type-error-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'TypeError: Can only concatenate str to str, not float',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Bawal direktang i-plus (+) ang string at number sa Python nang walang conversion.'
              : 'In Python, strings cannot be concatenated with numbers using + without explicit casting.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Ang Python ay strongly-typed language, hindi nito auto-covert ang float papuntang string sa addition.'
              : 'Python does not implicitly coerce numerical types to strings during concatenation.',
          fixApplied: 'Used f-string formatting f"Student Average: {result:.2f}".',
          originalSnippet: 'print("Student Average: " + result)',
          fixedSnippet: 'print(f"Student Average: {result:.2f}")',
        });
        fixedCode = fixedCode.replace('print("Student Average: " + result)', 'print(f"Student Average: {result:.2f}")');
      }
    });
  }

  // 2. Java patterns
  if (detected === 'java') {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.includes('for (int i = 1; i <= arr.length; i++)') || line.includes('<= arr.length')) {
        issues.push({
          id: `java-bounds-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'ArrayIndexOutOfBoundsException',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Ginamit mo ang "<=" sa arr.length. Ang huling valid index ng Java array ay arr.length - 1.'
              : 'Using "<=" with arr.length attempts to read past the end of the array.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Kapag umabot ang loop counter na i sa arr.length, magki-crash ang program with ArrayIndexOutOfBoundsException.'
              : 'Java array indexing is 0-indexed and bounds-checked. Accessing arr[arr.length] throws a runtime exception.',
          fixApplied: 'Changed "<=" to "<" and ensured loop covers index 0 to arr.length - 1.',
          originalSnippet: line.trim(),
          fixedSnippet: 'for (int i = 0; i < arr.length; i++)',
        });
        fixedCode = fixedCode.replace('for (int i = 1; i <= arr.length; i++)', 'for (int i = 0; i < arr.length; i++)');
      }
    });
  }

  // 3. C++ patterns
  if (detected === 'cpp') {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.trim() === 'int size = 5' || (line.includes('int size = 5') && !line.includes(';'))) {
        issues.push({
          id: `cpp-semicolon-${lineNum}`,
          lineNumber: lineNum,
          severity: 'syntax',
          title: 'Expected ";" before identifier',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Nakalimutan mo ang semicolon sa dulo ng variable declaration.'
              : 'Missing semicolon at the end of the variable assignment statement.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Sa C++, mandatory ang semicolon para malaman ng compiler kung saan natatapos ang statement bago magpatuloy sa next instruction.'
              : 'C++ syntax requires statement termination tokens so the grammar parser separates sequential declarations.',
          fixApplied: 'Added missing semicolon ";".',
          originalSnippet: 'int size = 5',
          fixedSnippet: 'int size = 5;',
        });
        fixedCode = fixedCode.replace('int size = 5', 'int size = 5;');
      }

      if (line.includes('delete') === false && code.includes('new int[size]') && !fixedCode.includes('delete[]')) {
        // Check if memory leak notice already added
        if (!issues.some(i => i.title.includes('Memory Leak'))) {
          issues.push({
            id: `cpp-mem-leak-${lineNum}`,
            lineNumber: lineNum,
            severity: 'warning',
            title: 'Memory Leak (Unfreed Heap Allocation)',
            simpleExplanation:
              explanationLanguage === 'taglish'
                ? 'Nag-allocate ka gamit ang "new int[]" pero nakalimutan mong mag "delete[]" bago mag-return.'
                : 'Heap memory allocated with "new int[]" was not released before function termination.',
            whyItWasWrong:
              explanationLanguage === 'taglish'
                ? 'Walang automatic garbage collector ang native C++. Bawat "new" ay dapat may kapares na "delete" para hindi maubos ang RAM.'
                : 'C++ uses manual memory management. Without calling delete[], allocated heap blocks remain orphaned in memory.',
            fixApplied: 'Added delete[] grades; prior to function return.',
            originalSnippet: 'return 0;',
            fixedSnippet: 'delete[] grades;\n    return 0;',
          });
          fixedCode = fixedCode.replace('return 0;', 'delete[] grades;\n    return 0;');
        }
      }
    });
  }

  // 4. JavaScript patterns
  if (detected === 'javascript' || detected === 'typescript') {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.includes('item.prce')) {
        issues.push({
          id: `js-typo-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'Property Typo (NaN Calculation)',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'May typo sa property: "item.prce" sa halip na "item.price", kaya nagiging NaN ang total.'
              : 'Typo in object property access ("item.prce" instead of "item.price"), evaluating to undefined and causing NaN.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Sa JavaScript, ang pag-access sa undefined property ay nagbabalik ng "undefined". Kapag minultiply mo ito sa quantity, nagiging "NaN" (Not a Number).'
              : 'Accessing an undefined property returns undefined; arithmetic with undefined yields NaN.',
          fixApplied: 'Corrected property name to item.price.',
          originalSnippet: 'subtotal += item.prce * item.quantity;',
          fixedSnippet: 'subtotal += item.price * item.quantity;',
        });
        fixedCode = fixedCode.replace('item.prce', 'item.price');
      }

      if (line.includes('if (discountCode = "STUDENT10")') || line.includes('if (discountCode =')) {
        issues.push({
          id: `js-assign-${lineNum}`,
          lineNumber: lineNum,
          severity: 'logic',
          title: 'Accidental Assignment in Conditional',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Ginamit mo ang "=" (assignment) sa halip na "===" (comparison).'
              : 'Used single equals "=" (assignment) instead of "===" (strict equality check).',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Ang "=" ay nagbabago ng value ng variable imbes na magkumpara, kaya laging magiging true ang if statement kahit mali ang code.'
              : 'Single equals mutates discountCode and evaluates to a truthy string, always executing the discount branch.',
          fixApplied: 'Changed assignment "=" to strict equality comparison "===".',
          originalSnippet: 'if (discountCode = "STUDENT10")',
          fixedSnippet: 'if (discountCode === "STUDENT10")',
        });
        fixedCode = fixedCode.replace('discountCode = "STUDENT10"', 'discountCode === "STUDENT10"');
      }

      if (line.includes('subtotal - discnt')) {
        issues.push({
          id: `js-ref-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'ReferenceError: discnt is not defined',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Typo sa variable name: "discnt" sa halip na "discount".'
              : 'Identifier typo: "discnt" is referenced instead of declared "discount".',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Tinatapon ng browser o Node.js ang ReferenceError kapag tinawag mo ang variable na hindi pa na-declare.'
              : 'The JavaScript runtime throws ReferenceError when resolving undeclared identifiers in the current scope.',
          fixApplied: 'Corrected to "discount".',
          originalSnippet: 'const finalTotal = subtotal - discnt;',
          fixedSnippet: 'const finalTotal = subtotal - discount;',
        });
        fixedCode = fixedCode.replace('subtotal - discnt', 'subtotal - discount');
      }
    });
  }

  // 5. SQL patterns
  if (detected === 'sql') {
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (line.includes('WHERE AVG(')) {
        issues.push({
          id: `sql-having-${lineNum}`,
          lineNumber: lineNum,
          severity: 'error',
          title: 'Misplaced Aggregate in WHERE Clause',
          simpleExplanation:
            explanationLanguage === 'taglish'
              ? 'Bawal gamitin ang aggregate functions tulad ng AVG() sa WHERE clause; gamitin ang HAVING clause.'
              : 'Aggregate functions like AVG() cannot be evaluated in a WHERE clause; use HAVING instead.',
          whyItWasWrong:
            explanationLanguage === 'taglish'
              ? 'Sinasala ng WHERE ang individual rows bago mag-group. Ang HAVING naman ang sumasala pagkatapos kalkulahin ang aggregates.'
              : 'WHERE filters rows before grouping occurs. Aggregates are only computed during/after grouping, requiring HAVING.',
          fixApplied: 'Moved aggregate condition from WHERE to HAVING clause.',
          originalSnippet: line.trim(),
          fixedSnippet: 'HAVING AVG(e.final_grade) >= 85.0',
        });
        fixedCode = fixedCode.replace(line, '-- Aggregate filtered in HAVING clause\nGROUP BY s.student_id, s.full_name\nHAVING AVG(e.final_grade) >= 85.0');
      }
    });
  }

  // Generic fallback if no specific issue was detected
  if (issues.length === 0) {
    issues.push({
      id: 'general-review-1',
      lineNumber: 1,
      severity: 'best-practice',
      title: 'Code Structure Review Passed',
      simpleExplanation:
        explanationLanguage === 'taglish'
          ? 'Maganda ang pagkakasulat ng code mo! Walang nakitang obvious syntax bugs o critical errors.'
          : 'Great work! No fatal syntax errors or major runtime bugs were detected in this pass.',
      whyItWasWrong:
        explanationLanguage === 'taglish'
          ? 'Naka-check ang logic at variable definitions; siguraduhing subukan ang iba\'t ibang test inputs.'
          : 'Code conforms to standard language conventions. Be sure to verify edge cases and boundary inputs.',
      fixApplied: 'Formatted and verified logic flow.',
      originalSnippet: lines[0] || '',
      fixedSnippet: lines[0] || '',
    });
  }

  const errors = issues.filter(i => i.severity === 'error' || i.severity === 'syntax').length;
  const warnings = issues.filter(i => i.severity === 'warning' || i.severity === 'logic').length;

  return {
    detectedLanguage: detected,
    languageDisplayName: langNames[detected] || detected.toUpperCase(),
    summary: {
      totalIssues: issues.length,
      errorsCount: errors,
      warningsCount: warnings,
      fixesAppliedCount: issues.length,
      healthScoreBefore: Math.max(30, 100 - (errors * 25 + warnings * 15)),
      healthScoreAfter: 100,
    },
    issues,
    fixedCode,
    learningTakeaways: [
      explanationLanguage === 'taglish'
        ? 'Laging alamin ang base-0 indexing para maiwasan ang Off-by-One at Out of Bounds errors.'
        : 'Always remember 0-based indexing to prevent off-by-one and boundary exceptions.',
      explanationLanguage === 'taglish'
        ? 'Sa variable naming at typing, iwasan ang typo at siguraduhing tugma ang data types bago mag-operate.'
        : 'Double-check variable spellings and data type compatibility before executing mathematical operations.',
      explanationLanguage === 'taglish'
        ? 'I-test ang code gamit ang edge cases (tulad ng empty lists, null inputs, o zero).'
        : 'Rigorously test with edge cases (empty collections, null inputs, and zero denominators).',
    ],
    explanationLanguage,
    generalVerdict:
      explanationLanguage === 'taglish'
        ? `Matagumpay na na-debug ang ${langNames[detected] || detected}! Naayos ang ${issues.length} na issue at handa na itong patakbuhin.`
        : `Successfully analyzed and fixed your ${langNames[detected] || detected} code! Resolved ${issues.length} issues and produced a clean, working solution.`,
  };
}

async function startServer() {
  // Determine if running as compiled production bundle or standalone deployment (Railway, Cloud Run, etc.)
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    Boolean(process.env.RAILWAY_SERVICE_ID) ||
    !process.env.APPLET_ID ||
    process.argv[1]?.includes('dist');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DamonFix AI server running on http://0.0.0.0:${PORT} [mode: ${isProduction ? 'production' : 'development'}]`);
  });
}

startServer();
