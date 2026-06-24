import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, isOAuth } = await req.json();

    if (!email || (!password && !isOAuth)) {
      return NextResponse.json({ success: false, error: 'auth_error_empty' }, { status: 400 });
    }

    const emailNormalized = email.toLowerCase().trim();
    const found = await findUserByEmail(emailNormalized);

    if (!found) {
      return NextResponse.json({ success: false, error: 'auth_error_invalid' }, { status: 401 });
    }

    // Skip password check if authenticated via Google OAuth
    if (!isOAuth) {
      const passwordHash = btoa(encodeURIComponent(password));
      if (found.passwordHash !== passwordHash) {
        return NextResponse.json({ success: false, error: 'auth_error_invalid' }, { status: 401 });
      }
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
        levelNumber: found.levelNumber,
      }
    });
  } catch (error: any) {
    console.error('[Login API Error]', error);
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
