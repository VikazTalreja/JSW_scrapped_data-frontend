import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Path to the qualified news CSV file relative to the project root
const CSV_FILE = path.join(process.cwd(), '..', 'qualified_news.csv');

export async function GET() {
  try {
    const response = await fetch('https://meresu-jsw-backend.onrender.com/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
} 