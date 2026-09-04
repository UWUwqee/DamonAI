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

// Multi-tier AI Failover Orchestrator for Interactive Student Chat
export async function chatWithFailover(
  question: string,
  code: string,
  fixedCode: string,
  explanationLanguage: 'english' | 'taglish'
): Promise<{ reply: string; aiProviderUsed?: string }> {
  const systemInstruction = `You are Damon. Your name is Damon (refer to yourself only as Damon, never DamonFix or DamonFix AI). You are an expert student coding tutor and friendly developer mentor.
The student has submitted code and received a fix. Now they are asking a follow-up question.
Language mode: ${
    explanationLanguage === 'taglish'
      ? 'TAGLISH (conversational Filipino-English as used by Philippine college students)'
      : 'Plain, easy-to-understand student-friendly English'
  }.
Keep your answers direct, crystal-clear, pedagogical, and encouraging. Introduce or refer to yourself strictly as Damon. Include short code examples if helpful.`;

  const chatPrompt = `Context:
[Original Code]:
${code ? code.slice(0, 3000) : 'None'}

[Fixed Code]:
${fixedCode ? fixedCode.slice(0, 3000) : 'None'}

Student Question:
${question}

Please answer the student's question clearly.`;

  // 1. Try Gemini
  const client = getGeminiClient();
  if (client) {
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-pro-preview'];
    for (const modelName of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: chatPrompt,
          config: { systemInstruction, temperature: 0.4 },
        });
        if (response.text) {
          return { reply: response.text, aiProviderUsed: `Google Gemini (${modelName})` };
        }
      } catch (err) {
        console.warn(`[Chat] Gemini ${modelName} busy, trying next...`);
      }
    }
  }

  // 2. Try Groq Free Tier
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: chatPrompt },
          ],
          temperature: 0.4,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return { reply: content, aiProviderUsed: 'Groq Cloud (Llama 3.3 70B - Free Tier)' };
        }
      }
    } catch (err) {
      console.warn('[Chat] Groq failed, trying OpenRouter...');
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
          temperature: 0.4,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return { reply: content, aiProviderUsed: 'OpenRouter Free (Llama 3.3 70B)' };
        }
      }
    } catch (err) {
      console.warn('[Chat] OpenRouter failed, using student tutor knowledge base...');
    }
  }

  // Fallback Tutor Answer
  const fallbackReply =
    explanationLanguage === 'taglish'
      ? `Magandang tanong! Sa pag-code, laging tandaan na i-verify ang index bounds (0 to n-1), variable types, at function parameters. Kung may logic bug, subukan maglagay ng console.log o print() sa bawat loop iteration para makita ang exact flow ng variables!`
      : `Great question! In programming, always ensure index bounds stay within 0 to n-1 and data types match. If you encounter logic bugs, inserting step-by-step print statements inside loops will immediately show where your variables diverge!`;

  return { reply: fallbackReply, aiProviderUsed: 'Damon Local Knowledge Base' };
}
