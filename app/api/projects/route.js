import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Path to the qualified news CSV file relative to the project root
const CSV_FILE = path.join(process.cwd(), '..', 'qualified_news.csv');

export async function GET() {
  try {
    // Check if file exists
    if (!fs.existsSync(CSV_FILE)) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Read the CSV file
    const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
    
    // Parse CSV to JSON
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error loading projects from CSV:', error);
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
} 