import { NextRequest, NextResponse } from 'next/server';
import { getAttempts, addAttempt, findUserByEmail, updateUserXp, QuizAttempt } from '@/lib/db';

export async function GET() {
  try {
    const attempts = await getAttempts();
    return NextResponse.json({ success: true, attempts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const attempt: QuizAttempt = await req.json();

    if (!attempt || !attempt.id || !attempt.assignmentId || !attempt.studentEmail) {
      return NextResponse.json({ success: false, error: 'Ma\'lumotlar to\'liq emas' }, { status: 400 });
    }

    await addAttempt(attempt);

    // Update user XP & Level in database too
    let updatedUser = null;
    const user = await findUserByEmail(attempt.studentEmail);

    if (user) {
      const xpEarned = Math.round((attempt.score || 0) * 1.5);
      const newXp = user.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1;

      await updateUserXp(attempt.studentEmail, newXp, newLevel);
      
      updatedUser = {
        ...user,
        xp: newXp,
        levelNumber: newLevel
      };
    }

    return NextResponse.json({ success: true, attempt, updatedUser });
  } catch (error: any) {
    console.error('[Attempts API Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
