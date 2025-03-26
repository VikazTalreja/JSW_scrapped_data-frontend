import { NextResponse } from 'next/server';
import { pipelineRunning } from '../run_pipeline/route';

export async function GET() {
  return NextResponse.json({ running: pipelineRunning }, { status: 200 });
} 