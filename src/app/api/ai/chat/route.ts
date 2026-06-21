import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateContentWithRetry(
  genAI: GoogleGenerativeAI,
  contents: any[],
  systemInstruction: string
): Promise<string> {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction
        });
        const result = await model.generateContent({ contents });
        const text = result.response.text();
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Chat Failed] model=${modelName}, attemptsLeft=${attempts - 1}, error=`, err.message);
        
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

export async function POST(req: Request) {
  try {
    const { message, history, studentLevel, apiKey } = await req.json();

    const actualKey = apiKey || process.env.GEMINI_API_KEY;

    // Adapt instruction based on educational level
    let systemInstruction = '';
    if (studentLevel === 'school') {
      systemInstruction = `Siz maktab o'quvchilari uchun shaxsiy repetitorsiz. Mavzularni juda sodda, oson va bolalarga mos qiziqarli misollar bilan tushuntiring. Murakkab ilmiy atamalardan qoching yoki ularni sodda o'xshatishlar bilan izohlang. Do'stona va rag'batlantiruvchi ohangda javob bering. Eslatma: Har qanday matematik formula yoki tenglamalarni yozganda LaTeX formatidan ($...$ inline va $$...$$ block) foydalaning. Masalan: $\\int x^2 dx$ yoki $f(x) = x^2$.`;
    } else if (studentLevel === 'college') {
      systemInstruction = `Siz kollej/litsey o'quvchisi uchun repetitorsiz. O'rta murakkablikdagi atamalarni ishlating, amaliy masalalar va hayotiy misollar bilan tushuntiring. Ohangingiz professional va rag'batlantiruvchi bo'lsin. Eslatma: Har qanday matematik formula yoki tenglamalarni yozganda LaTeX formatidan ($...$ inline va $$...$$ block) foydalaning. Masalan: $\\int x^2 dx$ yoki $f(x) = x^2$.`;
    } else {
      // university
      systemInstruction = `Siz universitet talabasi va tadqiqotchilari uchun yuqori malakali akademik mentorsiz. Javoblaringiz chuqur tahliliy, ilmiy jihatdan asoslangan va akademik atamalar bilan boyitilgan bo'lishi kerak. Matematik formulalar yoki dasturlash kodlarini eng optimal shaklda yozib, ularni batafsil sharhlang. Eslatma: Har qanday matematik formula yoki tenglamalarni yozganda LaTeX formatidan ($...$ inline va $$...$$ block) foydalaning. Masalan: $\\int x^2 dx$ yoki $f(x) = x^2$.`;
    }

    // 1. Fallback Mock response if API key is not present
    if (!actualKey) {
      console.log('Gemini API key is not set. Running in mock simulator mode.');
      const simulatedReply = getSimulatedReply(message, studentLevel);
      return NextResponse.json({ reply: simulatedReply });
    }

    // 2. Real Gemini Request
    const genAI = new GoogleGenerativeAI(actualKey);

    // Formatting previous history for chat structure
    const contents = history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    // Add user's latest query
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const replyText = await generateContentWithRetry(genAI, contents, systemInstruction);

    return NextResponse.json({ reply: replyText });

  } catch (error: any) {
    console.error('API Chat route error:', error);
    return NextResponse.json(
      { error: error.message || 'Ichki server xatoligi' },
      { status: 500 }
    );
  }
}

// Function to generate high quality mock replies for demo purposes
function getSimulatedReply(message: string, level: string): string {
  const query = message.toLowerCase();

  if (query.includes('kvant') || query.includes('fizika')) {
    if (level === 'school') {
      return `Kvant fizikasi — bu dunyodagi eng kichik zarralar (masalan, atomlar) qanday yashashi haqidagi fanning bir bo'lagidir.\n\nTasavvur qiling, sizning uyingizdagi to'plar bir vaqtning o'zida ikkita xonada tura oladi! Kvant olamida zarralar aynan shunday g'aroyib xususiyatlarga ega. Ular bir vaqtning o'zida har xil joyda bo'la oladi. Buni tushunish qiyin, lekin juda qiziqarli!`;
    }
    return `Kvant fizikasi — mikroolamdagi elementar zarralar, atomlar va molekulalarning harakat qonuniyatlarini o'rganuvchi nazariy fizika bo'limidir.\n\nAsosiy prinsiplari:\n1. Zarracha-to'lqin dualizmi: Har qanday mikrozarracha (masalan, elektron) ham to'lqin, ham zarracha xususiyatini namoyon qiladi.\n2. Geyzenberg noaniqlik prinsipi: Mikrozarrachaning koordinatasi va impulsini bir vaqtda mutlaq aniqlik bilan o'lchab bo'lmaydi.\n3. Superpozitsiya: Tizim o'lchov o'tkazilgunga qadar barcha mumkin bo'lgan holatlar yig'indisida (superpozitsiyada) bo'ladi (Shredinger mushugi tajribasi bunga misol).`;
  }

  if (query.includes('quick sort') || query.includes('saralash') || query.includes('algoritm')) {
    if (level === 'school') {
      return `Quick Sort (Tezkor saralash) — bu tartibsiz turgan sonlarni tezda tartibga solish (kichikdan kattaga o'tkazish) usulidir.\n\nTasavvur qiling, sizda bir necha xil bo'yli bolalar bor. Siz o'rtadagi bitta bolani tanlaysiz (uni "tayanch" deymiz). Undan kaltaroq bolalarni chap tomonga, undan uzunroqlarini o'ng tomonga o'tkazasiz. Keyin chap va o'ng tomonni ham xuddi shunday alohida tartibga solasiz. Shunda barcha bolalar bo'yiga qarab tartib bilan saf tortadi!`;
    }
    return `Quick Sort — bu "Bo'lib tashla va hukmronlik qil" (Divide and Conquer) metodiga asoslangan samarali saralash algoritmidir.\n\nO'rtacha vaqt murakkabligi: O(n log n). Eng yomon holatda (Worst case) esa O(n^2) ni tashkil etadi (agar tayanch element yomon tanlansa).\n\nMana Python tildagi sodda realizatsiyasi:\n\n\`\`\`python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2] # tayanch element\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# Sinab ko'rish:\nprint(quick_sort([3, 6, 8, 10, 1, 2, 1])) # [1, 1, 2, 3, 6, 8, 10]\n\`\`\``;
  }

  if (query.includes('kasr') || query.includes('matematika')) {
    return `Kasr sonlarni qo'shish qoidasi:\n\n1. Agar kasrlarning maxrajlari (pastki qismi) bir xil bo'lsa, ularning suratlari (ustki qismi) qo'shiladi, maxraj esa o'zgarishsiz qoladi:\n   $$\\frac{a}{c} + \\frac{b}{c} = \\frac{a+b}{c}$$\n   Masalan: $\\frac{1}{5} + \\frac{2}{5} = \\frac{3}{5}$.\n\n2. Agar maxrajlar har xil bo'lsa, avval ularni umumiy maxrajga keltirish kerak. Buning uchun maxrajlarning eng kichik umumiy karralisi (EKUK) topiladi.\n   Masalan: $\\frac{1}{3} + \\frac{1}{2}$.\n   3 va 2 uchun umumiy maxraj — 6.\n   Birinchi kasrni 2 ga ko'paytiramiz ($\\frac{2}{6}$), ikkinchisini 3 ga ($\\frac{3}{6}$).\n   Endi qo'shamiz: $\\frac{2}{6} + \\frac{3}{6} = \\frac{5}{6}$.`;
  }

  // Generic Default
  if (level === 'school') {
    return `Bu juda ajoyib savol! Maktab darsligimiz bo'yicha bu mavzuni tushunish juda oson. Keling, buni oddiy hayotiy misol bilan ko'rib chiqamiz. Agar yana qayeridir tushunarsiz bo'lsa, so'rang, boshqacharoq tushuntirishga harakat qilaman.`;
  } else if (level === 'college') {
    return `Ushbu mavzu kollej o'quv dasturining amaliy qismi uchun juda muhimdir. Keltirilgan ma'lumotlar mavzuning amaliy tahlili uchun asos bo'ladi. Qo'shimcha misollar ko'rishni istasangiz, ayting.`;
  } else {
    return `Universitet akademik darajasi nuqtai nazaridan olib qaraganda, siz so'ragan konsept fundamental xarakterga ega. Ushbu nazariy model ilmiy izlanishlarda keng qo'llaniladi. Uni yanada chuqurroq o'rganish uchun tegishli ilmiy adabiyotlarni tahlil qilishni tavsiya etaman.`;
  }
}
