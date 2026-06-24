import { NextRequest, NextResponse } from 'next/server';
import { getCheatingLogs, addCheatingLog, CheatingLog } from '@/lib/db';

export async function GET() {
  try {
    const cheatingLogs = await getCheatingLogs();
    return NextResponse.json({ success: true, cheatingLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawLog = await req.json();

    if (!rawLog || !rawLog.studentEmail || !rawLog.assignmentTitle || !rawLog.eventType) {
      return NextResponse.json({ success: false, error: 'Log ma\'lumotlari to\'liq emas' }, { status: 400 });
    }

    const log: CheatingLog = {
      ...rawLog,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    await addCheatingLog(log);

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
