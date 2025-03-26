import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Global variable to track pipeline state
export let pipelineRunning = false;

export async function POST() {
  try {
    // Check if pipeline is already running
    if (pipelineRunning) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Pipeline is already running' 
      }, { status: 400 });
    }
    
    // Set pipeline status
    pipelineRunning = true;
    
    // Path to the Python script relative to project root
    const scriptPath = path.join(process.cwd(), '..', 'deepseek_pipeline.py');
    
    // Spawn the Python process
    const pythonProcess = spawn('python', [scriptPath], {
      cwd: path.join(process.cwd(), '..') // Run in parent directory
    });
    
    // Log output for debugging
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Pipeline output: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Pipeline error: ${data}`);
    });
    
    // Set up completion handler
    pythonProcess.on('close', (code) => {
      console.log(`Pipeline process exited with code ${code}`);
      pipelineRunning = false;
    });
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Pipeline started successfully' 
    }, { status: 200 });
    
  } catch (error) {
    // Reset pipeline status on error
    pipelineRunning = false;
    console.error('Error running pipeline:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Failed to run pipeline' 
    }, { status: 500 });
  }
} 