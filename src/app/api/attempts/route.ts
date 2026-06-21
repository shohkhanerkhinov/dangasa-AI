import { NextRequest, NextResponse } from 'next/server';
import { getAttempts, addAttempt, readDb, writeDb, QuizAttempt } from '@/lib/db';

export async function GET() {
  try {
    const attempts = getAttempts();
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

    addAttempt(attempt);

    // Update user XP & Level in database too
    const db = readDb();
    const userIndex = db.registeredUsers.findIndex(
      u => u.email.toLowerCase() === attempt.studentEmail.toLowerCase()
    );

    let updatedUser = null;
    if (userIndex !== -1) {
      const u = db.registeredUsers[userIndex];
      const xpEarned = Math.round((attempt.score || 0) * 1.5);
      const newXp = u.xp + xpEarned;
      const newLevel = Math.floor(newXp / 100) + 1;

      db.registeredUsers[userIndex] = {
        ...u,
        xp: newXp,
        levelNumber: newLevel
      };
      
      updatedUser = db.registeredUsers[userIndex];
      writeDb(db);
    }

    return NextResponse.json({ success: true, attempt, updatedUser });
  } catch (error: any) {
    console.error('[Attempts API Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
