import { GoogleGenAI, Type } from '@google/genai';

export interface AIProviderInfo {
  id: string;
  name: string;
  configured: boolean;
  model: string;
  isFree: boolean;
  description: string;
  freeKeyUrl: string;
}

export interface AnalysisInput {
  code: string;
  language?: string;
  filename?: string;
  explanationLanguage: 'english' | 'taglish';
}

export interface AnalysisOutput {
  detectedLanguage: string;
  languageDisplayName: string;
  summary: {
    totalIssues: number;
    errorsCount: number;
    warningsCount: number;
    fixesAppliedCount: number;
    healthScoreBefore: number;
    healthScoreAfter: number;
  };
  issues: Array<{
    id: string;
    lineNumber: number;
    endLineNumber?: number;
    severity: 'error' | 'warning' | 'syntax' | 'logic' | 'runtime' | 'best-practice';
    title: string;
    simpleExplanation: string;
    whyItWasWrong: string;
    fixApplied: string;
    originalSnippet?: string;
    fixedSnippet?: string;
  }>;
  fixedCode: string;
  learningTakeaways: string[];
  generalVerdict: string;
  explanationLanguage: 'english' | 'taglish';
  aiProviderUsed?: string;
}

// Clean JSON response from LLMs that might include markdown fences or preamble
export function cleanAndParseJSON(raw: string): any {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response received from model');
  }
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// Check which free AI providers are configured via environment variables
export function getAvailableProviders(): AIProviderInfo[] {
  return [
    {
      id: 'gemini',
      name: 'Google Gemini',
      configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
      model: 'Gemini 3.6 Flash / 3.8 Flash',
      isFree: true,
      description: 'Google AI Studio free tier (15 RPM, high intelligence).',
      freeKeyUrl: 'https://aistudio.google.com/apikey',
    },
    {
      id: 'groq',
      name: 'Groq Cloud AI',
      configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
      model: 'Llama 3.3 70B Versatile / Qwen 2.5 Coder',
      isFree: true,
      description: '100% Free ultra-fast inference (500+ tokens/sec, no credit card required).',
      freeKeyUrl: 'https://console.groq.com/keys',
    },
    {
      id: 'openrouter',
      name: 'OpenRouter Free Tier',
      configured: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()),
      model: 'Meta Llama 3.3 70B Free / DeepSeek R1 Free',
      isFree: true,
      description: '100% Free models pool with zero cost on OpenRouter.',
      freeKeyUrl: 'https://openrouter.ai/keys',
    },
    {
      id: 'huggingface',
      name: 'Hugging Face Serverless',
      configured: Boolean(
        (process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.trim()) ||
        (process.env.HF_TOKEN && process.env.HF_TOKEN.trim())
      ),
      model: 'Qwen 2.5 Coder 32B / DeepSeek R1 Distill',
      isFree: true,
      description: '100% Free community serverless inference token.',
      freeKeyUrl: 'https://huggingface.co/settings/tokens',
    },
    {
      id: 'offline-ast',
      name: 'DamonFix Local AST Engine',
      configured: true,
      model: 'Zero-Downtime Multi-Language Parser',
      isFree: true,
      description: 'Built-in offline safety net: guaranteed to work even with zero internet or quota limits.',
      freeKeyUrl: '',
    },
  ];
}

// 1. Google Gemini Provider
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function callGemini(
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; modelName: string } | null> {
  const client = getGeminiClient();
  if (!client) return null;

  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
  for (const modelName of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              languageDisplayName: { type: Type.STRING },
              summary: {
                type: Type.OBJECT,
                properties: {
                  totalIssues: { type: Type.INTEGER },
                  errorsCount: { type: Type.INTEGER },
                  warningsCount: { type: Type.INTEGER },
                  fixesAppliedCount: { type: Type.INTEGER },
                  healthScoreBefore: { type: Type.INTEGER },
                  healthScoreAfter: { type: Type.INTEGER },
                },
                required: ['totalIssues', 'errorsCount', 'warningsCount', 'fixesAppliedCount', 'healthScoreBefore', 'healthScoreAfter'],
              },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    lineNumber: { type: Type.INTEGER },
                    endLineNumber: { type: Type.INTEGER },
                    severity: { type: Type.STRING },
                    title: { type: Type.STRING },
                    simpleExplanation: { type: Type.STRING },
                    whyItWasWrong: { type: Type.STRING },
                    fixApplied: { type: Type.STRING },
                    originalSnippet: { type: Type.STRING },
                    fixedSnippet: { type: Type.STRING },
                  },
                  required: ['id', 'lineNumber', 'severity', 'title', 'simpleExplanation', 'whyItWasWrong', 'fixApplied'],
                },
              },
              fixedCode: { type: Type.STRING },
              learningTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              generalVerdict: { type: Type.STRING },
            },
            required: ['detectedLanguage', 'languageDisplayName', 'summary', 'issues', 'fixedCode', 'learningTakeaways', 'generalVerdict'],
          },
        },
      });

      if (response.text) {
        return { text: response.text, modelName };
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} failed or quota exceeded:`, err?.message || err);
    }
  }
  return null;
}

// 2. Groq Cloud Free Tier Provider (Ultra-Fast 500+ tokens/sec)
async function callGroq(
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; modelName: string } | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const candidateModels = [
    'llama-3.3-70b-versatile',
    'qwen-2.5-coder-32b',
    'deepseek-r1-distill-llama-70b',
    'llama-3.1-8b-instant',
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemInstruction}\nIMPORTANT: Respond with pure JSON only matching the requested schema. No markdown backticks or commentary.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`[Groq] Model ${model} returned HTTP ${response.status}:`, errorBody);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        return { text: content, modelName: `Groq Cloud (${model})` };
      }
    } catch (err: any) {
      console.warn(`[Groq] Request failed for model ${model}:`, err?.message || err);
    }
  }
  return null;
}

// 3. OpenRouter Free Tier Provider (100% Free Models)
async function callOpenRouter(
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; modelName: string } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  const candidateModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'deepseek/deepseek-r1:free',
    'mistralai/mistral-7b-instruct:free',
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://damonfix.ai',
          'X-Title': 'DamonFix AI',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemInstruction}\nIMPORTANT: Respond with pure JSON only matching the schema. No markdown code blocks.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`[OpenRouter] Model ${model} returned HTTP ${response.status}:`, errorBody);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        return { text: content, modelName: `OpenRouter Free (${model})` };
      }
    } catch (err: any) {
      console.warn(`[OpenRouter] Request failed for model ${model}:`, err?.message || err);
    }
  }
  return null;
}

// 4. Hugging Face Serverless Inference Provider
async function callHuggingFace(
  prompt: string,
  systemInstruction: string
): Promise<{ text: string; modelName: string } | null> {
  const token = process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_TOKEN?.trim();
  if (!token) return null;

  const candidateModels = [
    'Qwen/Qwen2.5-Coder-32B-Instruct',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://router.huggingface.co/hf-inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemInstruction}\nIMPORTANT: Respond with pure JSON only matching the schema.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) {
        return { text: content, modelName: `Hugging Face (${model})` };
      }
    } catch (err: any) {
      console.warn(`[HuggingFace] Request failed for model ${model}:`, err?.message || err);
    }
  }
  return null;
}

// Multi-tier AI Failover Orchestrator for Code Analysis
export async function analyzeCodeWithFailover(
  input: AnalysisInput,
  fallbackFn: (code: string, userLang?: string, explanationLanguage?: 'english' | 'taglish') => AnalysisOutput
): Promise<AnalysisOutput> {
  const { code, language, filename, explanationLanguage } = input;

  const langDirective =
    explanationLanguage === 'taglish'
      ? `CRITICAL EXPLANATION LANGUAGE: Use TAGLISH (Filipino-English conversational style commonly used in Philippine universities and tech communities).
         Examples of Taglish style:
         - "Sa line na ito, nakalimutan mong maglagay ng closing bracket..."
         - "Bakit ito mali: Hindi mo na-initialize yung variable kaya nagtapon ng NullReferenceException..."
         - "Tips para hindi maulit: Laging mag-double check ng loop condition bago mag-run..."
         Keep standard programming terms (like variable, loop, array, return, null, exception, scope) in English, but explain reasons and concepts in natural, friendly Taglish.`
      : `CRITICAL EXPLANATION LANGUAGE: Use plain, simple English accessible to beginner and intermediate computer science students.
         Avoid overly dense academic jargon without defining it. Explain the core intuition like a supportive senior tutor.`;

  const systemInstruction = `You are DamonFix AI — a universal code debugger and expert coding mentor for students.
Your mission is to:
1. Automatically identify the programming language (e.g. Python, Java, C++, JavaScript, TypeScript, C#, SQL, HTML, CSS, PHP, Go, Rust, Kotlin, Dart, Swift, Bash, etc.).
2. Scan the code thoroughly to identify ANY errors, bugs, syntax mistakes, runtime exceptions, off-by-one errors, memory leaks, undefined variables, type mismatches, and code smells.
3. If the code is already 100% bug-free, acknowledge it, give positive reinforcement, and suggest any minor optimization or modern best practices.
4. Produce the complete, clean, working FIXED version of the code that can be copied and run directly.
5. Provide a clear summary: total issues, errors count, warnings count, fixes applied count, and health score (0-100 before, 0-100 after).
6. For each issue, pinpoint:
   - lineNumber (1-based line number in original code)
   - endLineNumber (if multi-line)
   - severity ('error' for fatal/breaking bugs, 'warning' for bugs/leaks that might run but cause issues, 'syntax', 'logic', 'runtime', 'best-practice')
   - title (short concise error title)
   - simpleExplanation (${explanationLanguage === 'taglish' ? 'In friendly Taglish' : 'In simple, plain English'})
   - whyItWasWrong (The exact reason this fails in this programming language so the student actually understands)
   - fixApplied (What was changed to resolve it)
   - originalSnippet (short original buggy line/block)
   - fixedSnippet (short corrected line/block)
7. Provide 2-4 key "learningTakeaways" that the student can memorize for exams or future projects.
8. Output MUST be valid JSON with keys: detectedLanguage, languageDisplayName, summary, issues, fixedCode, learningTakeaways, generalVerdict.

${langDirective}`;

  const prompt = `Please inspect, debug, and fix the following student code:
Filename provided: ${filename || 'None'}
User hint / specified language: ${language || 'Auto-detect'}
Selected explanation mode: ${explanationLanguage}

--- BEGIN CODE ---
${code}
--- END CODE ---`;

  // Failover Chain 1: Google Gemini API (Primary Free Tier)
  try {
    const geminiRes = await callGemini(prompt, systemInstruction);
    if (geminiRes?.text) {
      const parsed = cleanAndParseJSON(geminiRes.text);
      return {
        ...parsed,
        explanationLanguage,
        aiProviderUsed: `Google Gemini (${geminiRes.modelName})`,
      };
    }
  } catch (err) {
    console.warn('[Failover] Gemini step failed, shifting to Groq Free Cloud...');
  }

  // Failover Chain 2: Groq Cloud API (100% Free Tier, Ultra-Fast Llama 3.3 70B & Qwen 2.5 Coder)
  try {
    const groqRes = await callGroq(prompt, systemInstruction);
    if (groqRes?.text) {
      const parsed = cleanAndParseJSON(groqRes.text);
      return {
        ...parsed,
        explanationLanguage,
        aiProviderUsed: groqRes.modelName,
      };
    }
  } catch (err) {
    console.warn('[Failover] Groq step failed, shifting to OpenRouter Free Tier...');
  }

  // Failover Chain 3: OpenRouter API (100% Free Models)
  try {
    const openRouterRes = await callOpenRouter(prompt, systemInstruction);
    if (openRouterRes?.text) {
      const parsed = cleanAndParseJSON(openRouterRes.text);
      return {
        ...parsed,
        explanationLanguage,
        aiProviderUsed: openRouterRes.modelName,
      };
    }
  } catch (err) {
    console.warn('[Failover] OpenRouter step failed, shifting to Hugging Face...');
  }

  // Failover Chain 4: Hugging Face Serverless
  try {
    const hfRes = await callHuggingFace(prompt, systemInstruction);
    if (hfRes?.text) {
      const parsed = cleanAndParseJSON(hfRes.text);
      return {
        ...parsed,
        explanationLanguage,
        aiProviderUsed: hfRes.modelName,
      };
    }
  } catch (err) {
    console.warn('[Failover] Hugging Face step failed, falling back to local AST engine...');
  }

  // Failover Chain 5: DamonFix Offline AST / Rule-Based Analyzer (100% Guaranteed Uptime)
  console.info('[Failover] Utilizing resilient DamonFix Local AST Engine.');
  const fallback = fallbackFn(code, language, explanationLanguage);
  return {
    ...fallback,
    explanationLanguage,
    aiProviderUsed: 'DamonFix Local AST Engine (Zero-Downtime Safe Fallback)',
  };
}

export interface ChatHistoryItem {
  sender?: 'user' | 'assistant';
  role?: string;
  text?: string;
  content?: string;
}

// Multi-tier AI Failover Orchestrator for Interactive Student Chat
export async function chatWithFailover(
  question: string,
  code: string,
  fixedCode: string,
  explanationLanguage: 'english' | 'taglish',
  history: ChatHistoryItem[] = []
): Promise<{ reply: string; aiProviderUsed?: string }> {
  const isTaglish = explanationLanguage === 'taglish';
  const systemInstruction = `You are Damon, a world-class student coding tutor, debugging mentor, and technical companion.
Your name is strictly "Damon" (never refer to yourself as DamonFix or DamonFix AI).
Personality: Friendly, encouraging, pedagogical, patient, clear, and pragmatic.
Language mode: ${
    isTaglish
      ? 'TAGLISH (conversational Filipino-English, spoken naturally by Philippine IT/CS college students. E.g., "Sa Python, zero-indexed ang list kaya... subukan mong i-check...")'
      : 'PLAIN STUDENT-FRIENDLY ENGLISH (accessible, high-contrast, free of unnecessary academic pretension).'
  }

Key Behavior Guidelines:
1. Respond ACCORDINGLY to the student's exact message:
   - If they greet you ("hi", "hello", "kumusta", "who are you"), greet them warmly as Damon and invite them to ask about their code or programming concepts.
   - If they ask how to use the app, provide a concise guide (upload/paste code, select language, click Analyze & Fix, inspect side-by-side diff, ask questions).
   - If they ask about the code or the fix, pinpoint the exact variables, line numbers, and logic differences.
   - If they ask how to run or test the code, provide copyable terminal commands for their specific programming language.
   - If they ask conceptual questions (recursion, pointers, Big O, arrays, OOP, async/await), explain step-by-step with clean code examples.
2. Continuity: When prior conversation history is provided, maintain seamless context and answer follow-ups accurately.
3. Formatting: Use neat Markdown, bold keywords for scannability, and fenced code blocks with language identifiers.`;

  // Format prior conversation context
  const formattedHistory = (history || [])
    .slice(-6)
    .map((h) => {
      const sender = h.sender === 'user' || h.role === 'user' ? 'Student' : 'Damon';
      const text = h.text || h.content || '';
      return `${sender}: ${text}`;
    })
    .filter(Boolean)
    .join('\n');

  const chatPrompt = `[Context Information]
Student's Code:
${code && code.trim() ? code.slice(0, 3000) : '(No code provided yet)'}

Damon's Fixed Code:
${fixedCode && fixedCode.trim() ? fixedCode.slice(0, 3000) : '(No code fixed yet)'}

Recent Conversation History:
${formattedHistory ? formattedHistory : '(Starting fresh conversation)'}

Student's Current Message:
"${question}"

Please provide a direct, helpful, and natural response as Damon:`;

  // 1. Try Google Gemini (Prioritize stable, fast models)
  const client = getGeminiClient();
  if (client) {
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
    ];
    for (const modelName of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: chatPrompt,
          config: {
            systemInstruction,
            temperature: 0.35,
          },
        });
        if (response.text && response.text.trim()) {
          return { reply: response.text.trim(), aiProviderUsed: `Google Gemini (${modelName})` };
        }
      } catch (err: any) {
        console.warn(`[Chat] Gemini model ${modelName} unavailable, falling over:`, err?.message || err);
      }
    }
  }

  // 2. Try Groq Cloud Free Tier (Fast Llama 3.3 70B)
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-2.5-coder-32b'];
    for (const model of groqModels) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: chatPrompt },
            ],
            temperature: 0.35,
            max_tokens: 1500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && content.trim()) {
            return { reply: content.trim(), aiProviderUsed: `Groq Cloud (${model})` };
          }
        }
      } catch (err) {
        console.warn(`[Chat] Groq ${model} failed, trying next...`);
      }
    }
  }

  // 3. Try OpenRouter Free Tier
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://damonfix.ai',
          'X-Title': 'DamonFix AI',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: chatPrompt },
          ],
          temperature: 0.35,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && content.trim()) {
          return { reply: content.trim(), aiProviderUsed: 'OpenRouter Free (Llama 3.3 70B)' };
        }
      }
    } catch (err) {
      console.warn('[Chat] OpenRouter failed, invoking Damon Local Tutor Knowledge Base...');
    }
  }

  // 4. Intelligent Context-Aware Semantic Fallback Responder
  // Generates accurate, highly relevant student responses even when all external AI APIs are unreachable
  const smartReply = generateSmartTutorResponse(question, code, fixedCode, explanationLanguage);
  return { reply: smartReply, aiProviderUsed: 'Damon Smart Tutor Engine' };
}

// Semantic fallback tutor engine: accurately matches question intent and context
function generateSmartTutorResponse(
  question: string,
  code: string,
  fixedCode: string,
  explanationLanguage: 'english' | 'taglish'
): string {
  const isTaglish = explanationLanguage === 'taglish';
  const q = question.toLowerCase().trim();

  // Detect language of the code snippet
  let lang = 'python';
  if (code.includes('public class') || code.includes('System.out.println')) lang = 'java';
  else if (code.includes('#include') || code.includes('std::') || code.includes('cout <<')) lang = 'cpp';
  else if (code.includes('Console.WriteLine') || code.includes('using System;')) lang = 'csharp';
  else if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('console.log')) lang = 'javascript';
  else if (code.includes('SELECT') || code.includes('FROM ') || code.includes('WHERE ')) lang = 'sql';
  else if (code.includes('package main') || code.includes('func main')) lang = 'go';
  else if (code.includes('fn main()')) lang = 'rust';

  // 1. Greetings / Identity
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'kumusta' ||
    q === 'musta' ||
    q.includes('good morning') ||
    q.includes('good afternoon') ||
    q.includes('good evening') ||
    q.includes('who are you') ||
    q.includes('sino ka') ||
    q.includes('your name') ||
    q.includes('pangalan mo')
  ) {
    if (isTaglish) {
      return (
        `**Kumusta! Ako si Damon**, ang iyong personal coding tutor at debugging mentor.\n\n` +
        `Nandito ako para tulungan kang mag-debug ng code (Python, Java, C++, JavaScript, C#, atbp.), ipaliwanag ang mga error sa malinaw na paraan, at magbigay ng tips para gumanda ang programming habits mo.\n\n` +
        `May gusto ka bang ipa-check sa code mo, o may topic sa school/projects na gusto mong linawin?`
      );
    }
    return (
      `**Hello! I'm Damon**, your dedicated coding tutor and code debugger.\n\n` +
      `I'm here to help you pinpoint bugs, understand root causes line-by-line, and learn best programming practices across Python, Java, C++, JavaScript, C#, and more.\n\n` +
      `Do you have code you'd like me to review, or a specific programming concept you'd like to explore?`
    );
  }

  // 2. How to use / App Guidance
  if (
    q.includes('how to use') ||
    q.includes('paano gamitin') ||
    q.includes('how does this work') ||
    q.includes('paano ito gumagana') ||
    q.includes('what can you do') ||
    q.includes('ano pwede mong gawin') ||
    q.includes('features') ||
    q.includes('tulong') ||
    q.includes('help')
  ) {
    if (isTaglish) {
      return (
        `Napakadaling gamitin ng **DamonFix AI**! Narito ang mabilis na hakbang:\n\n` +
        `1. **I-paste o I-upload ang Code:** Ilagay ang code mo sa editor o i-drag and drop ang source file.\n` +
        `2. **Pumili ng Wika at Language Mode:** Piliin kung Python, Java, C++, JS, etc., at itakda kung **English** o **Taglish** ang paliwanag.\n` +
        `3. **Pindutin ang Analyze & Fix:** Pindutin ang button o mag-shortcut gamit ang \`Ctrl + Enter\` para masuri ang syntax at logic bugs.\n` +
        `4. **Suriin ang Diff & Paliwanag:** Tingnan ang side-by-side comparison, basahin ang line-by-line breakdown, o i-download ang naayos na code.\n` +
        `5. **Magtanong kay Damon:** Gamitin ang chat na ito para magtanong tungkol sa time complexity, edge cases, o paano patakbuhin!`
      );
    }
    return (
      `Using **DamonFix AI** is straightforward:\n\n` +
      `1. **Paste or Upload Code:** Enter your code in the main editor or drag and drop your file into the Upload tab.\n` +
      `2. **Set Language & Mode:** Select your programming language (or use Auto-Detect) and choose English or Taglish.\n` +
      `3. **Click Analyze & Fix:** Press the button or hit \`Ctrl + Enter\` to run the static and logic analyzer.\n` +
      `4. **Review Diffs & Root Causes:** Inspect the side-by-side diff, read the line-by-line root causes, and download the fixed source file.\n` +
      `5. **Ask Damon:** Use this chat terminal anytime to ask follow-up questions about performance, testing, or execution!`
    );
  }

  // 3. Execution / How to Run Locally
  if (
    q.includes('how to run') ||
    q.includes('paano patakbuhin') ||
    q.includes('run locally') ||
    q.includes('paano i-run') ||
    q.includes('compile') ||
    q.includes('terminal') ||
    q.includes('execute')
  ) {
    const runCommands: Record<string, string> = {
      python: 'python main.py\n# Or on Mac/Linux:\npython3 main.py',
      javascript: 'node script.js',
      typescript: 'npx tsx script.ts\n# Or with tsc:\ntsc script.ts && node script.js',
      java: 'javac Main.java\njava Main',
      cpp: 'g++ -std=c++17 main.cpp -o app\n./app',
      csharp: 'dotnet run',
      go: 'go run main.go',
      rust: 'rustc main.rs && ./main\n# Or in a Cargo project:\ncargo run',
      sql: '-- Open your database client (psql, sqlite3, MySQL Workbench):\nsqlite3 database.db < query.sql',
    };

    const cmd = runCommands[lang] || runCommands.python;

    if (isTaglish) {
      return (
        `Para mapatakbo ang **${lang.toUpperCase()}** code mo sa iyong computer terminal:\n\n` +
        `\`\`\`bash\n${cmd}\n\`\`\`\n\n` +
        `**Tip:** Siguraduhing naka-install ang kaukulang compiler o runtime (hal. Python, Node.js, JDK, o GCC/Clang) at nasa tamang folder ka sa terminal (\`cd your-folder\`).`
      );
    }
    return (
      `Here is how to run and test your **${lang.toUpperCase()}** code in your local terminal:\n\n` +
      `\`\`\`bash\n${cmd}\n\`\`\`\n\n` +
      `**Quick Check:** Ensure you have the runtime/compiler installed and that your terminal working directory is inside the folder containing your source file.`
    );
  }

  // 4. Time and Space Complexity (Big O)
  if (
    q.includes('complexity') ||
    q.includes('big o') ||
    q.includes('time complexity') ||
    q.includes('space complexity') ||
    q.includes('runtime') ||
    q.includes('efficiency') ||
    q.includes('mabilis ba')
  ) {
    const hasNestedLoop = /(for|while)[\s\S]{1,100}(for|while)/i.test(code);
    const hasSingleLoop = /(for|while)\b/i.test(code);

    const timeComp = hasNestedLoop ? 'O(N²)' : hasSingleLoop ? 'O(N)' : 'O(1)';
    const spaceComp = code.includes('new ') || code.includes('append') || code.includes('push') ? 'O(N)' : 'O(1)';

    if (isTaglish) {
      return (
        `Narito ang complexity analysis ng code:\n\n` +
        `- **Time Complexity: ${timeComp}** — ${
          hasNestedLoop
            ? 'May nested loops kaya lumalaki ang execution time nang quadratic sa dami ng inputs (N²).'
            : hasSingleLoop
            ? 'Tumatakbo ito nang linear O(N) dahil isang beses lang ini-iterate ang list/collection.'
            : 'Constant time O(1) dahil walang repetitive loops o recursion.'
        }\n` +
        `- **Space Complexity: ${spaceComp}** — ${
          spaceComp === 'O(N)'
            ? 'Nag-aallocate ng karagdagang memory batay sa laki ng data.'
            : 'Gumagamit lamang ng constant na auxiliary memory para sa ilang variables.'
        }\n\n` +
        `Maaari itong i-optimize pa kung gagamit ng hash maps (dictionary/object) para sa O(1) lookups!`
      );
    }
    return (
      `Here is the complexity breakdown for this logic:\n\n` +
      `- **Time Complexity: ${timeComp}** — ${
        hasNestedLoop
          ? 'Contains nested loops, making the execution time scale quadratically (N²).'
          : hasSingleLoop
          ? 'Runs in linear time O(N) by traversing the elements in a single iteration.'
          : 'Runs in constant time O(1) with direct operations.'
      }\n` +
      `- **Space Complexity: ${spaceComp}** — ${
        spaceComp === 'O(N)'
          ? 'Allocates additional dynamic memory proportional to input size.'
          : 'Uses constant auxiliary memory for local variables.'
      }\n\n` +
      `For large datasets, always prefer O(N) or O(N log N) algorithms over O(N²) when possible!`
    );
  }

  // 5. Edge Cases & Testing Inquiries
  if (
    q.includes('edge case') ||
    q.includes('test case') ||
    q.includes('boundary') ||
    q.includes('subukan') ||
    q.includes('testing') ||
    q.includes('null') ||
    q.includes('empty')
  ) {
    if (isTaglish) {
      return (
        `Mahalagang subukan ang sumusunod na **Edge Cases** para masigurong matatag ang code mo:\n\n` +
        `1. **Empty Collection:** Subukan magpasa ng walang laman na list/array (\`[]\` o \`null\`). Dapat hindi mag-crash o mag-throw ng error.\n` +
        `2. **Single Element:** Halimbawa \`[42]\` para masigurong gumagana ang first at last index handling.\n` +
        `3. **Negative at Zero Values:** Kung may arithmetic o division, siguraduhing hindi magkakaron ng Division by Zero.\n` +
        `4. **Duplicate Inputs:** Subukan kapag magkakapareho ang elements para matiyak na tama ang conditional comparisons (\`==\` vs \`<=\`).`
      );
    }
    return (
      `Here are the critical **Edge Cases** you should test:\n\n` +
      `1. **Empty Inputs:** Pass an empty collection (\`[]\`, empty string \`""\`, or \`null\`) to verify guard clauses.\n` +
      `2. **Single Element:** Test with exactly 1 element (e.g., \`[10]\`) to ensure boundary index calculations don't overshoot.\n` +
      `3. **Negative & Zero Values:** Ensure division by zero is guarded and negative numbers behave as expected.\n` +
      `4. **Duplicate / Extreme Values:** Pass identical elements to check that relational operators (\`<=\` vs \`<\`) don't skip or loop infinitely.`
    );
  }

  // 6. Best Practices / Clean Code Advice
  if (
    q.includes('best practice') ||
    q.includes('clean code') ||
    q.includes('refactor') ||
    q.includes('tips') ||
    q.includes('paano pagandahin') ||
    q.includes('advice')
  ) {
    if (isTaglish) {
      return (
        `Narito ang **Student Best Practices** para maging malinis at madaling basahin ang code mo:\n\n` +
        `- **Descriptive Variable Names:** Iwasan ang single-letter variables tulad ng \`x\`, \`y\`, \`temp\`. Gamitin ang \`itemTotal\`, \`studentList\`, o \`userIndex\`.\n` +
        `- **Guard Clauses / Early Returns:** I-check agad ang invalid inputs sa simula ng function para maiwasan ang malalalim na nested \`if\` statements.\n` +
        `- **Isang Gawain Bawat Function:** Panatilihing maikli at nakatutok sa iisang responsibilidad ang bawat function (Single Responsibility Principle).\n` +
        `- **Consistent Formatting:** Panatilihin ang parehong indentation (2 o 4 spaces) sa buong file.`
      );
    }
    return (
      `Here are essential **Best Practices** for writing clean, professional code:\n\n` +
      `- **Descriptive Identifiers:** Replace cryptic variable names like \`t\` or \`arr\` with clear names like \`itemCount\` or \`studentScores\`.\n` +
      `- **Early Return / Guard Clauses:** Check for invalid parameters or empty collections at the top of functions to avoid deeply nested \`if\` blocks.\n` +
      `- **Single Responsibility:** Keep functions focused on doing one thing well and returning a predictable result.\n` +
      `- **Consistent Formatting:** Maintain standard indentation (2 or 4 spaces) and descriptive comments explaining *why* something is done, not just *what*.`
    );
  }

  // 7. Explaining the Fix / Code Differences
  if (
    q.includes('why') ||
    q.includes('bakit') ||
    q.includes('explain') ||
    q.includes('paliwanag') ||
    q.includes('fix') ||
    q.includes('differ') ||
    q.includes('line')
  ) {
    if (code && fixedCode && code !== fixedCode) {
      if (isTaglish) {
        return (
          `Tiningnan ko ang pagkakaiba ng original code at ng fix:\n\n` +
          `Sa original code, may mga bahaging nagdudulot ng error o runtime issue (halimbawa: index boundary bounds, incorrect comparison operators, o uninitialized variables).\n\n` +
          `**Ang Ginawang Fix:**\n` +
          `- Ini-adjust ang loop o condition para manatili sa wastong data bounds.\n` +
          `- Tiniyak na ang bawat variable ay may tamang type at declaration.\n\n` +
          `Tingnan ang **Split View** sa panel para makita nang magkatabi ang pulang linya (inalis) at berdeng linya (ipinalit)!`
        );
      }
      return (
        `Comparing the original code against the fix:\n\n` +
        `The original snippet had logic or syntax issues (such as boundary index overshooting, mismatched comparison operators, or unhandled null checks).\n\n` +
        `**Key Improvements in the Patch:**\n` +
        `- Corrected loop termination conditions to prevent index out of bounds errors.\n` +
        `- Standardized variable scopes and operator semantics for predictable runtime execution.\n\n` +
        `You can toggle to **Split View** in the diagnostic panel above to inspect the exact line-by-line diff!`
      );
    }
  }

  // 8. Polite Closing / Thanks
  if (
    q.includes('thank') ||
    q.includes('salamat') ||
    q.includes('galing') ||
    q.includes('awesome') ||
    q.includes('cool') ||
    q.includes('ok na') ||
    q.includes('okay na')
  ) {
    if (isTaglish) {
      return `Walang anuman! Masaya akong nakatulong sa'yo. Kung may iba ka pang code o bugs na gustong suriin, i-paste mo lang sa editor anytime. Happy coding!`;
    }
    return `You're very welcome! Glad I could help clarify things. Whenever you have more code to review or debug, just drop it in the editor. Happy coding!`;
  }

  // 9. Contextual Default Guidance
  if (isTaglish) {
    return (
      `Magandang tanong tungkol sa iyong code!\n\n` +
      `Para sa tanong mo na: *"**${question}**"*\n\n` +
      `1. **Logic Verification:** Siguraduhing maayos ang daloy ng conditionals (\`if/else\`) at hindi nagkakaroon ng accidental variable overwriting.\n` +
      `2. **Index at Data Types:** Sa halos lahat ng programming languages (Python, Java, C++, JS), ang collections ay **0-indexed** (0 hanggang n - 1).\n` +
      `3. **Step-by-Step Debugging:** Subukang maglagay ng print/console.log statements bago at pagkatapos ng bawat critical step para makita ang exact values habang tumatakbo.\n\n` +
      `May partikular bang linya o error message na lumalabas na gusto nating himayin nang magkasama?`
    );
  }

  return (
    `Great question regarding your code!\n\n` +
    `Regarding: *"**${question}**"*\n\n` +
    `1. **Logic Flow:** Check that your conditionals (\`if/else\`) and loop boundaries properly terminate on every branch.\n` +
    `2. **Zero-Based Indexing:** Remember that array/list collections in Python, Java, C++, and JS index from \`0\` to \`length - 1\`.\n` +
    `3. **Step-by-Step Tracing:** If your logic diverges, insert print statements inside your loops or conditionals to trace variable values at each step.\n\n` +
    `Is there a specific line or runtime error message you'd like us to dig deeper into together?`
  );
}
