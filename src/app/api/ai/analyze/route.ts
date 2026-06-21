import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const QUESTION_COUNT = 5;

function buildStrictPrompt(topic: string, subject: string, difficulty: string, level: string, count: number) {
  return `You are an expert academic content creator specializing in "${subject}" for ${level} students.

Your ONLY task is to create ${count} exam questions STRICTLY about: "${topic}"

CRITICAL RULES — FOLLOW EXACTLY:
1. ALL questions MUST be directly related to "${topic}" and ONLY "${topic}"
2. Do NOT include any questions from other topics, chapters, or subjects
3. Do NOT mention any concept that is NOT part of "${topic}"
4. Difficulty: ${difficulty}
5. Education Level: ${level}
6. Subject: ${subject}
7. IMPORTANT FOR MATH AND PHYSICS: Render ALL mathematical equations, integrals, fractions, limits, powers, derivatives, and formulas strictly in LaTeX format using $...$ for inline equations and $$...$$ for block equations (e.g. write "$\\int \\frac{1}{x^3} dx$" as "$\\int \\frac{1}{x^3} dx$"). Do NOT write plain text representations like "Integral (1/x^3) dx" or "5^x". Options must also be formatted in LaTeX if they contain formulas.

Examples of topics to NEVER mix if topic is "${topic}":
- Do not include chemistry if physics topic selected
- Do not include history if math topic selected  
- Keep 100% focus on: "${topic}"

Return ONLY this JSON (no markdown, no extra text):
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text directly about ${topic}",
      "type": "multiple-choice",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ..."
    }
  ]
}`;
}

function buildGradingPrompt(questions: any[], answers: Record<string, string>, topic: string, subject: string) {
  const qaText = questions.map(q => {
    const userAns = answers[q.id] || '(not answered)';
    return `Q: ${q.text}\nCorrect: ${q.correctAnswer}\nStudent answered: ${userAns}`;
  }).join('\n\n');

  return `You are an expert grader for ${subject} — specifically the topic "${topic}".

Evaluate these answers and return feedback:

${qaText}

Return ONLY this JSON:
{
  "score": <number from 0 to ${questions.length * 10}>,
  "feedback": "<2-3 sentence personalized feedback mentioning the topic: ${topic}, highlighting what was good and what needs improvement>"
}`;
}

function generateMockQuestions(topic: string, difficulty: string, count: number) {
  const questions = [];
  const diffs: Record<string, string> = { easy: 'basic', medium: 'intermediate', hard: 'advanced' };
  const d = diffs[difficulty] || 'basic';

  const isMath = /integral|matematika|fizika|tenglama|kasr|hosila|limit|derivative|equation|math/i.test(topic);

  if (isMath) {
    const mathTemplates = [
      {
        text: `Quyidagi integralni hisoblang: $$\\int \\frac{1}{x^3} dx$$`,
        options: [
          `A) $-\\frac{1}{2x^2} + C`,
          `B) $-\\frac{3}{x^4} + C`,
          `C) \\frac{1}{2x^2} + C`,
          `D) $-\\frac{1}{4x^4} + C`
        ],
        correctAnswer: `A) $-\\frac{1}{2x^2} + C`
      },
      {
        text: `Integrallar jadvaliga ko'ra, ko'rsatkichli funksiya uchun $$\\int 5^x dx$$ ning boshlang'ich funksiyasini aniqlang.`,
        options: [
          `A) \\frac{5^x}{\\ln(5)} + C`,
          `B) 5^x \\cdot \\ln(5) + C`,
          `C) \\frac{5^{x+1}}{x+1} + C`,
          `D) Hech biri to'g'ri emas`
        ],
        correctAnswer: `A) \\frac{5^x}{\\ln(5)} + C`
      },
      {
        text: `Quyidagi ifodaning hosilasini toping: $$f(x) = x^2 \\sin(x)$$`,
        options: [
          `A) $f'(x) = 2x \\sin(x) + x^2 \\cos(x)$`,
          `B) $f'(x) = 2x \\cos(x)$`,
          `C) $f'(x) = 2x \\sin(x) - x^2 \\cos(x)$`,
          `D) $f'(x) = x^2 \\cos(x)$`
        ],
        correctAnswer: `A) $f'(x) = 2x \\sin(x) + x^2 \\cos(x)$`
      },
      {
        text: `Quyidagi limitni hisoblang: $$\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$$`,
        options: [
          `A) $1$`,
          `B) $0$`,
          `C) $\\infty$`,
          `D) Mavjud emas`
        ],
        correctAnswer: `A) $1$`
      },
      {
        text: `Kvadrat tenglamaning diskriminant formulasini ko'rsating: $$ax^2 + bx + c = 0$$`,
        options: [
          `A) $D = b^2 - 4ac$`,
          `B) $D = b^2 + 4ac$`,
          `C) $D = b - 4ac$`,
          `D) $D = b^2 - ac$`
        ],
        correctAnswer: `A) $D = b^2 - 4ac$`
      }
    ];

    for (let i = 0; i < count; i++) {
      const template = mathTemplates[i % mathTemplates.length];
      questions.push({
        id: `q${i + 1}`,
        text: `[${d.toUpperCase()}] ${template.text}`,
        type: 'multiple-choice',
        options: template.options,
        correctAnswer: template.correctAnswer
      });
    }
    return questions;
  }

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `q${i + 1}`,
      text: `[${d.toUpperCase()}] ${topic} haqida ${i + 1}-savol: Quyidagi tushunchalardan qaysi biri "${topic}" mavzusiga to'g'ridan-to'g'ri aloqador?`,
      type: 'multiple-choice',
      options: [
        `A) ${topic} ning asosiy ta'rifi`,
        `B) ${topic} ning qo'llanilishi`,
        `C) ${topic} bilan bog'liq misol`,
        `D) Hech biri to'g'ri emas`,
      ],
      correctAnswer: `A) ${topic} ning asosiy ta'rifi`,
    });
  }
  return questions;
}

async function generateContentWithRetry(
  genAI: GoogleGenerativeAI,
  prompt: string
): Promise<string> {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Request Failed] model=${modelName}, attemptsLeft=${attempts - 1}, error=`, err.message);
        
        if (attempts > 1 && (err.message?.includes('503') || err.message?.includes('429') || err.message?.includes('Limit') || err.message?.includes('Unavailable'))) {
          attempts--;
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
      }
      break;
    }
  }

  throw lastError || new Error('Barcha modellar ulanishi muvaffaqiyatsiz tugadi');
}

async function extractTextFromFile(name: string, type: string, base64: string): Promise<string> {
  const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    return data.text;
  }

  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.toLowerCase().endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Default: txt, csv, json, md, etc.
  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      const { topic, subject, difficulty = 'medium', level = 'university', questionCount = QUESTION_COUNT, apiKey } = body;

      if (!topic || !subject) {
        return NextResponse.json({ error: 'topic va subject majburiy' }, { status: 400 });
      }

      const key = apiKey || process.env.GEMINI_API_KEY;

      if (!key) {
        // Mock mode — strictly topic-focused mock
        const questions = generateMockQuestions(topic, difficulty, questionCount);
        return NextResponse.json({ questions, mode: 'mock' });
      }

      const genAI = new GoogleGenerativeAI(key);
      const prompt = buildStrictPrompt(topic, subject, difficulty, level, questionCount);
      const text = await generateContentWithRetry(genAI, prompt);

      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return NextResponse.json({ error: 'AI javobini parse qilishda xatolik', raw: text }, { status: 500 });
      }

      return NextResponse.json({ questions: parsed.questions || [], mode: 'live' });
    }

    if (action === 'grade') {
      const { questions, answers, topic = 'General', subject = 'General', apiKey } = body;

      if (!questions || !answers) {
        return NextResponse.json({ error: 'questions va answers majburiy' }, { status: 400 });
      }

      const key = apiKey || process.env.GEMINI_API_KEY;

      if (!key) {
        // Mock grading
        let correct = 0;
        for (const q of questions) {
          if (answers[q.id] && q.correctAnswer && answers[q.id].trim().toLowerCase().startsWith(q.correctAnswer.trim().toLowerCase()[0])) {
            correct++;
          }
        }
        const score = Math.round((correct / questions.length) * questions.length * 10);
        return NextResponse.json({
          score,
          maxScore: questions.length * 10,
          feedback: `Siz "${topic}" mavzusidan ${correct}/${questions.length} to'g'ri javob berdingiz. ${correct >= questions.length * 0.7 ? 'Yaxshi natija! Davom eting.' : "Ko'proq mashq qiling va mavzuni qayta o'rganing."}`,
          mode: 'mock'
        });
      }

      const genAI = new GoogleGenerativeAI(key);
      const prompt = buildGradingPrompt(questions, answers, topic, subject);
      const text = await generateContentWithRetry(genAI, prompt);

      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return NextResponse.json({ error: 'AI grading parse error', raw: text }, { status: 500 });
      }

      return NextResponse.json({
        score: parsed.score ?? 0,
        maxScore: questions.length * 10,
        feedback: parsed.feedback ?? 'Baholash yakunlandi.',
        mode: 'live'
      });
    }

    if (action === 'analyze-file') {
      const { content, filename, files, apiKey } = body;

      let combinedContent = '';
      let combinedFilename = filename || 'file';

      if (files && Array.isArray(files) && files.length > 0) {
        const fileTexts = [];
        for (const file of files) {
          try {
            const text = await extractTextFromFile(file.name, file.type, file.base64);
            fileTexts.push(`--- File: ${file.name} ---\n${text}\n`);
          } catch (err: any) {
            console.error(`Error parsing file ${file.name}:`, err);
            fileTexts.push(`--- File: ${file.name} ---\n(Error parsing file: ${err.message})\n`);
          }
        }
        combinedContent = fileTexts.join('\n');
        combinedFilename = files.map(f => f.name).join(', ');
      } else {
        if (!content) {
          return NextResponse.json({ error: 'content yoki files majburiy' }, { status: 400 });
        }
        combinedContent = content;
      }

      const key = apiKey || process.env.GEMINI_API_KEY;

      if (!key) {
        // Mock extraction
        const mockQs = [
          { id: 'fq1', text: `"${combinedFilename}" faylidan olingan: Asosiy tushuncha nima?`, type: 'multiple-choice', options: ['A) Birinchi javob', 'B) Ikkinchi javob', 'C) Uchinchi javob', 'D) To\'rtinchi javob'], correctAnswer: 'A) Birinchi javob' },
          { id: 'fq2', text: `"${combinedFilename}" faylidan olingan: Qaysi ta'rif to'g'ri?`, type: 'multiple-choice', options: ['A) Ta\'rif A', 'B) Ta\'rif B', 'C) Ta\'rif C', 'D) Ta\'rif D'], correctAnswer: 'B) Ta\'rif B' },
          { id: 'fq3', text: `"${combinedFilename}" faylidan olingan: Misol qaysi?`, type: 'multiple-choice', options: ['A) Misol A', 'B) Misol B', 'C) Misol C', 'D) Misol D'], correctAnswer: 'C) Misol C' },
        ];
        return NextResponse.json({ questions: mockQs, detectedTopic: combinedFilename, mode: 'mock' });
      }

      const genAI = new GoogleGenerativeAI(key);

      const filePrompt = `You are an expert academic content creator and test question extractor.

Analyze the following text content extracted from the uploaded file(s) (Source: "${combinedFilename}"):

---
${combinedContent.slice(0, 20000)}
---

Your tasks:
1. Detect the main topic/subject of this content.
2. CRITICAL - EXTRACT PRE-EXISTING TESTS: Search the text carefully. If the text already contains a list of test questions, exam tasks, or multiple-choice questions (e.g. questions followed by A, B, C, D options, or numbered questions with answers), you MUST EXACTLY EXTRACT ALL of those questions and options.
   - Do NOT generate your own questions if the text already contains test questions.
   - Extract ALL questions you can find in the text (up to 20 questions).
   - Carefully determine the correct answer for each extracted question based on the text.
3. GENERATE QUESTIONS ONLY IF NONE EXIST: If and only if the text does NOT contain any pre-existing test questions, generate 5-10 high-quality multiple choice questions based strictly on the text content.
4. FORMATTING RULES:
   - Options must be formatted as "A) ...", "B) ...", "C) ...", "D) ...".
   - The correctAnswer must match the exact string of the correct option (e.g. "A) Option text").
   - IMPORTANT FOR MATH AND PHYSICS: Render ALL mathematical equations, integrals, fractions, limits, powers, derivatives, and formulas strictly in LaTeX format using $...$ for inline equations and $$...$$ for block equations (e.g. write "$\\int \\frac{1}{x^3} dx$" as "$\\int \\frac{1}{x^3} dx$"). Options must also be formatted in LaTeX if they contain formulas.

Return ONLY this JSON (no markdown wrapper, no backticks, no other text):
{
  "detectedTopic": "<main topic/subject of the content>",
  "questions": [
    {
      "id": "fq1",
      "text": "<question text>",
      "type": "multiple-choice",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ..."
    }
  ]
}`;

      const text = await generateContentWithRetry(genAI, filePrompt);

      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return NextResponse.json({ error: 'File analysis parse error', raw: text }, { status: 500 });
      }

      return NextResponse.json({
        questions: parsed.questions || [],
        detectedTopic: parsed.detectedTopic || combinedFilename,
        mode: 'live'
      });
    }

    return NextResponse.json({ error: 'Noto\'g\'ri action' }, { status: 400 });

  } catch (err: any) {
    console.error('[AI Analyze Error]', err);
    return NextResponse.json({ error: err.message || 'Server xatoligi' }, { status: 500 });
  }
}
