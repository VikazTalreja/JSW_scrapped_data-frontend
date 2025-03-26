import { NextResponse } from 'next/server';
import { pipelineRunning } from '../run_pipeline/route';

export async function GET() {
  try {
    const response = await fetch('https://meresu-jsw-backend.onrender.com/api/pipeline_status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error checking pipeline status:', error);
    return Response.json({ running: false, error: 'Failed to check pipeline status' }, { status: 500 });
  }
} 