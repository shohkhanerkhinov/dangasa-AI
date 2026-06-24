import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, addUser, RegisteredUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, level, profileImage } = await req.json();

    if (!name || !email || !password || !role || !level) {
      return NextResponse.json({ success: false, error: 'auth_error_empty' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'auth_error_short_pass' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();
    const existing = await findUserByEmail(emailNormalized);

    if (existing) {
      return NextResponse.json({ success: false, error: 'auth_error_exists' }, { status: 400 });
    }

    // simple base64 encoding (matching the frontend btoa(encodeURIComponent(str)))
    const passwordHash = btoa(encodeURIComponent(password));

    const newUser: RegisteredUser = {
      name: name.trim(),
      email: emailNormalized,
      passwordHash,
      role,
      level,
      profileImage: profileImage || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      xp: 0,
      levelNumber: 1,
    };

    await addUser(newUser);

    return NextResponse.json({
      success: true,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        level: newUser.level,
        profileImage: newUser.profileImage,
        xp: newUser.xp,
        levelNumber: newUser.levelNumber,
      }
    });
  } catch (error: any) {
    console.error('[Register API Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
