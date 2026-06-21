import { NextRequest, NextResponse } from 'next/server';
import { getAssignmentById, updateAssignment, deleteAssignment, Assignment } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 });
    }

    const assignment = getAssignmentById(id);

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 });
    }

    const body: Assignment = await req.json();
    if (!body) {
      return NextResponse.json({ success: false, error: 'Yangilangan topshiriq ma\'lumotlari kiritilmadi' }, { status: 400 });
    }

    const existing = getAssignmentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    updateAssignment(id, body);
    return NextResponse.json({ success: true, assignment: { ...existing, ...body } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: any }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 });
    }

    const existing = getAssignmentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    deleteAssignment(id);
    return NextResponse.json({ success: true, message: 'Topshiriq muvaffaqiyatli o\'chirildi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server xatoligi' }, { status: 500 });
  }
}
