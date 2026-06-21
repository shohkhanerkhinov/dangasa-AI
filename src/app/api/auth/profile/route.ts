import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile, readDb } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const { email, name, level, profileImage } = await req.json();

    if (!email || !name || !level) {
      return NextResponse.json({ success: false, error: 'Barcha maydonlarni to\'ldiring' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();
    
    // We update the DB first
    updateUserProfile(emailNormalized, { name, level, profileImage });

    // Read again to return the updated object
    const db = readDb();
    const found = db.registeredUsers.find(u => u.email.toLowerCase() === emailNormalized);

    if (!found) {
      return NextResponse.json({ success: false, error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        name: found.name,
        email: found.email,
        role: found.role,
        level: found.level,
        profileImage: found.profileImage,
        xp: found.xp,
        levelNumber: found.levelNumber
      }
    });
  } catch (error: any) {
    console.error('[Profile API Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
