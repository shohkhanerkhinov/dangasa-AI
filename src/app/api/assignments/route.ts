import { NextRequest, NextResponse } from 'next/server';
import { getAssignments, addAssignment, Assignment } from '@/lib/db';

export async function GET() {
  try {
    const assignments = await getAssignments();
    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const assignment: Assignment = await req.json();

    if (!assignment || !assignment.id || !assignment.title || !assignment.questions) {
      return NextResponse.json({ success: false, error: 'Topshiriq ma\'lumotlari to\'liq emas' }, { status: 400 });
    }

    await addAssignment(assignment);
    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
