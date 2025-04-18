import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// Process the query with Groq API and project data
export async function POST(request) {
  try {
    const { messages, model = 'llama3-70b-8192' } = await request.json();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch from Groq API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Groq API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// In a production app, this would be done with a real CSV parser
async function loadProjectData() {
  try {
    const filePath = path.join(process.cwd(), '../../qualified_news.csv');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Basic CSV parsing (in real app, use a proper CSV library)
    const rows = fileContent.split('\n');
    const headers = rows[0].split(',');
    
    const projects = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      
      // Handle commas inside quoted fields
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let char of rows[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue);
      
      const project = {};
      headers.forEach((header, index) => {
        project[header] = values[index] || '';
      });
      
      projects.push(project);
    }
    
    return projects;
  } catch (error) {
    console.error('Error loading project data:', error);
    return [];
  }
}

function scoreProjects(projects, role, company, tags, query) {
  // Convert inputs to lowercase for case-insensitive matching
  const roleLC = role.toLowerCase();
  const companyLC = company.toLowerCase();
  const tagsLC = Array.isArray(tags) ? tags.map(tag => tag.toLowerCase()) : [];
  const queryLC = query.toLowerCase();
  
  // Define scoring weights based on business importance
  const weights = {
    highPriority: 35,        // High priority projects are most important
    mediumPriority: 18,      // Medium priority projects are somewhat important
    tagMatch: 40,            // Direct interest match is very important
    steelRequirements: 30,   // Steel projects are key for JSW
    roleMatch: 22,           // Role-specific matches add value
    specializedProject: 28,  // Specialized project types score higher
    contractValue: 20,       // High-value projects are important
    locationMatch: 25,       // Geographic relevance matters
    queryRelevance: 35       // Direct query matches are very important
  };
  
  return projects.map(project => {
    let score = 0;
    
    // Score based on urgency
    if (project.Urgency?.toLowerCase() === 'high') score += weights.highPriority;
    else if (project.Urgency?.toLowerCase() === 'medium') score += weights.mediumPriority;
    
    // Score based on project type match with tags
    const projectType = project["Project Type"]?.toLowerCase() || '';
    if (tagsLC.some(tag => projectType.includes(tag))) {
      score += weights.tagMatch;
    }
    
    // Score based on steel requirements
    if (project["Steel Requirements"] && 
        (queryLC.includes('steel') || tagsLC.some(tag => tag.includes('steel')))) {
      score += weights.steelRequirements;
    }
    
    // Score based on role match
    if ((roleLC.includes('manager') || roleLC.includes('director') || roleLC.includes('executive')) && 
        projectType.includes('infrastructure')) {
      score += weights.roleMatch;
    }
    
    // Score specialized projects
    if (tagsLC.includes('railway') && projectType.includes('railway')) {
      score += weights.specializedProject;
    }
    if (tagsLC.includes('metro') && projectType.includes('metro')) {
      score += weights.specializedProject;
    }
    if (tagsLC.includes('port') && projectType.includes('port')) {
      score += weights.specializedProject;
    }
    
    // Score based on contract value
    if (project["Contract Value"] && queryLC.includes('value')) {
      score += weights.contractValue;
    }
    
    // Score based on location match
    if (project.Location && companyLC.includes(project.Location.toLowerCase())) {
      score += weights.locationMatch;
    }
    
    // Score based on query relevance (title or description match)
    if ((project.Title && project.Title.toLowerCase().includes(queryLC)) ||
        (project.Reasoning && project.Reasoning.toLowerCase().includes(queryLC))) {
      score += weights.queryRelevance;
    }
    
    return { project, score };
  });
}

// Function to generate response using Groq API
async function generateGroqResponse(query, role, company, tags, topProjects) {
  try {
    // Format projects for the prompt
    const formattedProjects = topProjects.map((item, index) => {
      const p = item.project;
      return `Project ${index + 1}:
- Title: ${p.Title || 'Untitled'}
- Company: ${p.Company || 'Unknown'}
- Type: ${p["Project Type"] || 'N/A'}
- Location: ${p.Location || 'N/A'}
- Priority: ${p.Urgency || 'Low'}
- Value: ${p["Contract Value"] || p["Potential Value"] || 'Not specified'}
- Steel Requirements: ${p["Steel Requirements"] ? p["Steel Requirements"].substring(0, 200) + '...' : 'None specified'}
- Analysis: ${p.Reasoning ? p.Reasoning.substring(0, 200) + '...' : 'None specified'}
`.trim();
    }).join('\n\n');
    
    // Determine the type of query for better context
    const queryType = determineQueryType(query);
    
    // In a real implementation, you would call the Groq API here
    // For now, we'll simulate a response generation
    if (!process.env.GROQ_API_KEY) {
      return generateLocalResponse(query, role, company, tags, topProjects);
    }
    
    // Build a prompt for Groq
    const prompt = `You are a professional project advisor for JSW Steel, helping business development professionals find relevant project leads.
    
USER CONTEXT:
- Role: ${role}
- Company: ${company}
- Interests: ${tags.join(', ')}
- Question: "${query}"

TOP MATCHING PROJECTS:
${formattedProjects}

Your task is to provide a detailed, professional response to the user's question based on the project data above. 
Use markdown formatting with headings, bullet points, and emphasis for key information.

If the user is asking about ${queryType.type} projects, focus on explaining why these projects are relevant to them based on their role and company.
For each recommendation, provide clear reasoning on why the project should be prioritized.

The response should be detailed but concise, highlighting the most important aspects of the recommended projects.`;

    // Simulate API call to Groq
    // In a real implementation, you would make an actual API call
    console.log("Would call Groq API with:", prompt);
    
    // For now, return a local response
    return generateLocalResponse(query, role, company, tags, topProjects);
    
  } catch (error) {
    console.error('Error generating Groq response:', error);
    // Fallback to local response generation if API fails
    return generateLocalResponse(query, role, company, tags, topProjects);
  }
}

// Helper to determine query type for better context
function determineQueryType(query) {
  const queryLC = query.toLowerCase();
  
  if (queryLC.includes('prioritize') || queryLC.includes('urgent') || queryLC.includes('important')) {
    return { type: 'priority', focus: 'urgency and immediate action' };
  }
  
  if (queryLC.includes('steel')) {
    return { type: 'steel-focused', focus: 'steel requirements and specifications' };
  }
  
  if (queryLC.includes('value') || queryLC.includes('contract') || queryLC.includes('amount')) {
    return { type: 'high-value', focus: 'contract values and financial opportunity' };
  }
  
  if (queryLC.includes('location') || queryLC.includes('region') || queryLC.includes('area')) {
    return { type: 'location-based', focus: 'geographic relevance' };
  }
  
  return { type: 'general recommendation', focus: 'overall project alignment' };
}

// Fallback local response generation
function generateLocalResponse(query, role, company, tags, topProjects) {
  const queryLC = query.toLowerCase();
  let response = "";
  
  // Format projects for response
  const formattedProjects = topProjects.map((item, index) => {
    const p = item.project;
    return `**${index + 1}. ${p.Company || 'Unknown Company'}**: ${p.Title || 'Untitled Project'}\n` +
      `   • **Type**: ${p["Project Type"] || 'N/A'}\n` +
      `   • **Location**: ${p.Location || 'N/A'}\n` +
      `   • **Priority**: ${p.Urgency || 'Low'}\n` +
      `   • **Value**: ${p["Contract Value"] || p["Potential Value"] || 'Not specified'}\n` +
      (p["Steel Requirements"] ? `   • **Steel Requirements**: ${p["Steel Requirements"].substring(0, 100)}${p["Steel Requirements"].length > 100 ? '...' : ''}\n` : '') +
      (p.Reasoning ? `   • **Analysis**: ${p.Reasoning.substring(0, 100)}${p.Reasoning.length > 100 ? '...' : ''}\n` : '');
  }).join('\n\n');
  
  // Generate introduction based on query intent
  if (queryLC.includes('prioritize') || queryLC.includes('important') || queryLC.includes('urgent')) {
    response = `## High-Priority Projects for ${company}\n\nBased on your role as a ${role}, I've identified these priority projects that align with your interests in ${tags.join(', ')}:\n\n${formattedProjects}\n\n### Why These Projects Matter\nThese projects should be prioritized due to their urgency level, alignment with your business interests, and potential for immediate impact. The high-priority projects typically have shorter bidding windows and faster procurement processes.`;
  } 
  else if (queryLC.includes('steel')) {
    response = `## Projects with Significant Steel Requirements\n\nFor your role as ${role} at ${company}, here are projects with substantial steel components:\n\n${formattedProjects}\n\n### Steel Component Analysis\nThese projects have explicitly mentioned steel requirements that align with your interests. The steel components range from structural steel for infrastructure to specialized steel for industrial applications. Projects with specific steel requirements typically offer better negotiation positioning.`;
  } 
  else if (queryLC.includes('value') || queryLC.includes('contract') || queryLC.includes('amount')) {
    response = `## Highest Value Contract Opportunities\n\nBased on your role as ${role} at ${company}, here are the projects with significant contract values:\n\n${formattedProjects}\n\n### Business Impact Analysis\nThese high-value projects represent substantial opportunities for material supply. The contract values indicate the overall project scale, with steel components typically representing 15-30% of total project costs.`;
  } 
  else if (queryLC.includes('location') || queryLC.includes('region') || queryLC.includes('area')) {
    response = `## Projects By Location\n\nBased on your query about location, here are relevant projects for ${company} in the requested region:\n\n${formattedProjects}\n\n### Geographic Advantage Analysis\nThese projects are grouped by their geographic relevance. Proximity can offer logistics advantages and regional familiarity benefits when bidding for contracts.`;
  }
  else {
    response = `## Recommended Projects for ${company}\n\nBased on your role as ${role} and interests in ${tags.join(', ')}, here are the most relevant projects:\n\n${formattedProjects}\n\n### Strategic Recommendations\nThese projects were selected based on their alignment with your specified interests and company profile. The priority levels indicate urgency, with 'High' representing immediate opportunities that may require faster response times.`;
  }
  
  return response;
} 