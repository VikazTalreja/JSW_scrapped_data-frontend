import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Global variable to track pipeline state
export let pipelineRunning = false;

export async function POST() {
  try {
    const response = await fetch('https://meresu-jsw-backend.onrender.com/api/run_pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error running pipeline:', error);
    return Response.json({ status: 'error', message: 'Failed to run pipeline' }, { status: 500 });
  }
} 