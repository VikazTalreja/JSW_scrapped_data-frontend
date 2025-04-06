'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiRefreshCw, FiFilter, FiCalendar, FiInfo, FiBriefcase, FiMessageCircle, FiX, FiSend, FiChevronRight } from 'react-icons/fi';
import React from 'react';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField, 
  InputAdornment,
  ThemeProvider,
  createTheme,
  Button,
  Paper,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [availableProjectTypes, setAvailableProjectTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const rowsPerPage = 10;
  
  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [chatStage, setChatStage] = useState('role'); // role -> company -> tags -> chat
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I can help you find the most relevant project leads. Let\'s start with your role in the company.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  
  // Add ref for message container
  const messagesContainerRef = useRef(null);
  
  // Helper function to normalize project types
  const normalizeType = (type) => {
    if (!type || type.trim() === '') return null;
    
    // Normalize case (Title Case) and trim whitespace
    type = type.trim().toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    // Standardize common variations
    if (type.includes('Metro')) return 'Metro';
    if (type.includes('Railway') || type.includes('Rail')) return 'Railway';
    if (type.includes('Highway') || type.includes('Road')) return 'Highway/Road';
    if (type.includes('Port')) return 'Transportation - Port';
    if (type.includes('Airport')) return 'Airport';
    if (type.includes('Manufacturing') && type.includes('Cement')) return 'Manufacturing - Cement';
    if (type.includes('Manufacturing') && type.includes('Steel')) return 'Manufacturing - Steel';
    if (type.includes('Manufacturing')) return 'Manufacturing';
    if (type.includes('Power') || type.includes('Energy')) return 'Energy & Power';
    if (type.includes('Infrastructure')) return 'Infrastructure';
    
    return type;
  };
  
  // Create a theme to match your color scheme
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1f2937', // gray-800
      },
      secondary: {
        main: '#4b5563', // gray-600
      },
    },
    components: {
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: 'white',
            width: '100%',
            borderRadius: '0.375rem',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6b7280',
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '0.375rem',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
    },
  });
  
  // CSS for read more/less expanded state
  const expandedStyles = `
    .text-truncate {
      max-height: 3rem;
      overflow: hidden;
      position: relative;
      transition: max-height 0.3s ease;
    }
    
    .text-truncate.expanded {
      max-height: 100rem;
    }
    
    .expandable-row {
      cursor: pointer;
    }
    
    .expanded-row {
      background-color: #f9fafb;
    }
    
    .expanded-content {
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
      max-height: 0;
      opacity: 0;
      overflow: hidden;
    }
    
    .expanded-content.show {
      max-height: 500px;
      opacity: 1;
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .mobile-truncate {
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .mobile-wrap {
        white-space: normal !important;
        word-break: break-word;
      }
      
      .mobile-hide {
        display: none;
      }
    }
    
    @media (max-width: 640px) {
      .sm-truncate {
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `;
  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://meresu-jsw-backend.onrender.com/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Get the response text first
      const text = await response.text();
      
      // Handle special JSON values like NaN
      const sanitizedText = text
        .replace(/:\s*NaN\s*([,}])/g, ': null$1')  // Replace NaN with null
        .replace(/:\s*Infinity\s*([,}])/g, ': null$1')  // Replace Infinity with null
        .replace(/:\s*-Infinity\s*([,}])/g, ': null$1');  // Replace -Infinity with null
      
      // Parse the sanitized JSON
      const data = JSON.parse(sanitizedText);
      
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Show a user-friendly error message
      alert('Failed to load projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkPipelineStatus = async () => {
    try {
      const response = await fetch('https://meresu-jsw-backend.onrender.com/api/pipeline_status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setIsPipelineRunning(data.running);
      
      if (!data.running && isPipelineRunning) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error checking pipeline status:', error);
    }
  };
  
  useEffect(() => {
    fetchProjects();
    const interval = setInterval(checkPipelineStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const applyFilters = () => {
    let filtered = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        (project.Title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.Company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.Location || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(project => 
        (project.Urgency || '').toLowerCase() === priorityFilter.toLowerCase()
      );
    }
    
    // Apply project type filter
    if (projectTypeFilter) {
      filtered = filtered.filter(project => {
        // Normalize the project type for comparison
        let type = project["Project Type"];
        if (!type || type.trim() === '') return false;
        
        // Normalize case and trim
        type = type.trim().toLowerCase();
        
        // Match based on category
        if (projectTypeFilter === 'Metro' && type.includes('metro')) return true;
        if (projectTypeFilter === 'Railway' && (type.includes('railway') || type.includes('rail'))) return true;
        if (projectTypeFilter === 'Highway/Road' && (type.includes('highway') || type.includes('road'))) return true;
        if (projectTypeFilter === 'Transportation - Port' && type.includes('port')) return true;
        if (projectTypeFilter === 'Airport' && type.includes('airport')) return true;
        if (projectTypeFilter === 'Manufacturing - Cement' && type.includes('cement')) return true;
        if (projectTypeFilter === 'Manufacturing - Steel' && type.includes('steel')) return true;
        if (projectTypeFilter === 'Manufacturing' && type.includes('manufacturing') && 
            !type.includes('cement') && !type.includes('steel')) return true;
        if (projectTypeFilter === 'Energy & Power' && 
            (type.includes('power') || type.includes('energy'))) return true;
        if (projectTypeFilter === 'Infrastructure' && type.includes('infrastructure')) return true;
        
        // For other categories, exact match
        return normalizeType(project["Project Type"]) === projectTypeFilter;
      });
    }
    
    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        switch(sortBy) {
          case 'priority-high':
            return getPriorityValue(b.Urgency) - getPriorityValue(a.Urgency);
          case 'priority-low':
            return getPriorityValue(a.Urgency) - getPriorityValue(b.Urgency);
          case 'date-new':
            return new Date(b["Date Published"] || 0) - new Date(a["Date Published"] || 0);
          case 'date-old':
            return new Date(a["Date Published"] || 0) - new Date(b["Date Published"] || 0);
          default:
            return 0;
        }
      });
    }
    
    setFilteredProjects(filtered);
    setCurrentPage(1);
  };
  
  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, priorityFilter, projectTypeFilter, sortBy]);

  // Extract unique project types whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      // Extract available tags from project types
      const typesMap = new Map();
      
      projects.forEach(project => {
        let type = project["Project Type"];
        if (!type || type.trim() === '') return;
        
        const normalizedType = normalizeType(type);
        if (normalizedType) {
          typesMap.set(normalizedType, true);
        }
      });
      
      // Get unique types from map keys and sort alphabetically
      const uniqueTypes = [...typesMap.keys()].sort();
      setAvailableProjectTypes(uniqueTypes);
      setAvailableTags(uniqueTypes); // Set the available tags from project data
    }
  }, [projects]);
  
  const runPipeline = async () => {
    try {
      setIsPipelineRunning(true);
      const response = await fetch('http://127.0.0.1:5000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        setIsPipelineRunning(false);
        alert(data.message || 'Failed to start pipeline');
      }
    } catch (error) {
      setIsPipelineRunning(false);
      alert('Error starting pipeline: ' + error.message);
    }
  };
  
  const getPriorityValue = (priority) => {
    switch((priority || '').toLowerCase()) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };
  
  const toggleExpanded = (containerId, buttonId) => {
    const container = document.getElementById(containerId);
    const button = document.getElementById(buttonId);
    
    if (container.classList.contains('expanded')) {
      container.classList.remove('expanded');
      button.textContent = 'Read more';
    } else {
      container.classList.add('expanded');
      button.textContent = 'Read less';
    }
  };
  
  const toggleRow = (index) => {
    const expandedContent = document.getElementById(`expanded-row-${index}`);
    const row = document.getElementById(`project-row-${index}`);
    
    if (expandedContent.classList.contains('show')) {
      expandedContent.classList.remove('show');
      row.classList.remove('expanded-row');
    } else {
      expandedContent.classList.add('show');
      row.classList.add('expanded-row');
    }
  };
  
  // Pagination
  const pageCount = Math.ceil(filteredProjects.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + rowsPerPage);
  
  // Chat Helper Functions
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const advanceToNextStage = () => {
    if (chatStage === 'role' && userContext.trim()) {
      setChatStage('company');
      setMessages([
        ...messages,
        { role: 'user', content: userContext },
        { role: 'bot', content: `Thanks! What company do you represent? Please include your industry sector.` }
      ]);
      setInputMessage('');
    } else if (chatStage === 'company' && inputMessage.trim()) {
      setUserCompany(inputMessage);
      setChatStage('tags');
      setMessages([
        ...messages,
        { role: 'user', content: inputMessage },
        { role: 'bot', content: `Great! Please select project types you&apos;re interested in below.` }
      ]);
      setInputMessage('');
    } else if (chatStage === 'tags' && selectedTags.length > 0) {
      setChatStage('chat');
      
      // Generate initial recommendations based on collected information
      setIsProcessingResponse(true);
      
      const tagsMessage = `Selected interests: ${selectedTags.join(", ")}`;
      
      // Prepare data for initial recommendations
      const projectData = {
        recommendedProjects: generateScoredProjects(userContext, tagsMessage, userCompany)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(item => item.project)
      };
      
      // Add user message showing selected tags
      setMessages(prev => [...prev, { role: 'user', content: tagsMessage }]);
      
      // Generate response with formatting
      setTimeout(() => {
        const initialResponse = generateLocalResponse(
          "recommend projects", 
          userContext, 
          userCompany, 
          tagsMessage, 
          projectData
        );
        
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: initialResponse
        }]);
        
        setIsProcessingResponse(false);
      }, 1500);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || isProcessingResponse) return;
    
    // Add user message
    const updatedMessages = [
      ...messages,
      { role: 'user', content: inputMessage }
    ];
    setMessages(updatedMessages);
    
    // Start response processing
    setIsProcessingResponse(true);
    
    // Process message based on the current stage
    if (chatStage !== 'chat') {
      advanceToNextStage();
      setIsProcessingResponse(false);
      return;
    }
    
    // For chat stage, generate intelligent response via API
    fetchAIResponse(inputMessage, userContext, userCompany, selectedTags.join(", "));
  };
  
  // Function to fetch AI response from DeepSeek API
  const fetchAIResponse = async (query, role, company, requirements) => {
    try {
      // First gather data locally
      const projectData = prepareProjectDataForAPI(query, role, company, requirements);
      
      // Call DeepSeek API (simulated here with setTimeout)
      setTimeout(() => {
        const botResponse = generateLocalResponse(query, role, company, requirements, projectData);
        setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
        setInputMessage('');
        setIsProcessingResponse(false);
      }, 1500);
      
      // In a real implementation, you would do something like:
      /*
      const response = await fetch('https://your-backend-endpoint/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          userContext: role,
          userCompany: company,
          userRequirements: requirements,
          projectData
        })
      });
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
      setInputMessage('');
      setIsProcessingResponse(false);
      */
      
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm sorry, I encountered an error while processing your request. Please try again." 
      }]);
      setInputMessage('');
      setIsProcessingResponse(false);
    }
  };
  
  // Prepare project data for API
  const prepareProjectDataForAPI = (query, role, company, requirements) => {
    // Identify what kind of data we need based on the query
    const queryLC = query.toLowerCase();
    let projectData = {};
    
    // Get top 10 projects based on different criteria
    if (queryLC.includes('prioritize') || queryLC.includes('important') || queryLC.includes('urgent')) {
      // High priority projects
      projectData.highPriorityProjects = filteredProjects
        .filter(p => p.Urgency?.toLowerCase() === 'high')
        .slice(0, 10);
    } else if (queryLC.includes('steel')) {
      // Steel-related projects
      projectData.steelProjects = filteredProjects
        .filter(p => 
          (p["Steel Requirements"] && p["Steel Requirements"].length > 10) || 
          (p["Project Type"] && p["Project Type"].toLowerCase().includes('steel'))
        )
        .slice(0, 10);
    } else if (queryLC.includes('value') || queryLC.includes('contract') || queryLC.includes('amount')) {
      // Value-based projects
      projectData.valuableProjects = filteredProjects
        .filter(p => p["Contract Value"] || p["Potential Value"])
        .sort((a, b) => {
          const aVal = extractNumericValue(a["Contract Value"] || a["Potential Value"] || "0");
          const bVal = extractNumericValue(b["Contract Value"] || b["Potential Value"] || "0");
          return bVal - aVal;
        })
        .slice(0, 10);
    } else {
      // Score all projects based on user profile
      const scoredProjects = generateScoredProjects(role, requirements, company);
      projectData.recommendedProjects = scoredProjects
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.project);
    }
    
    // Add metadata for the API
    projectData.userProfile = {
      role,
      company,
      requirements
    };
    
    projectData.query = query;
    
    return projectData;
  };
  
  // Generate scored projects
  const generateScoredProjects = (role, tagString, company) => {
    // Extract key information from user inputs
    const roleLC = role.toLowerCase();
    const tagsLC = tagString.toLowerCase();
    const companyLC = company.toLowerCase();
    const userTags = selectedTags.map(tag => tag.toLowerCase());
    
    // Create a scoring system for projects
    return filteredProjects.map(project => {
      let score = 0;
      
      // Score based on urgency
      if (project.Urgency?.toLowerCase() === 'high') score += 30;
      else if (project.Urgency?.toLowerCase() === 'medium') score += 15;
      
      // Score based on project type match with tags
      const projectType = project["Project Type"]?.toLowerCase() || '';
      const normalizedType = normalizeType(project["Project Type"] || "")?.toLowerCase();
      
      // Boost score if project type matches selected tags
      if (normalizedType && userTags.includes(normalizedType.toLowerCase())) {
        score += 40; // Higher boost for exact tag match
      }
      
      // Score based on steel requirements
      if (userTags.includes('manufacturing - steel') && 
         (projectType.includes('steel') || 
          (project["Steel Requirements"] && project["Steel Requirements"].length > 10))) {
        score += 25;
      }
      
      // Score infrastructure projects for managers/directors
      if ((roleLC.includes('manager') || roleLC.includes('director') || roleLC.includes('executive')) && 
          projectType.includes('infrastructure')) {
        score += 20;
      }
      
      // Score railway projects
      if (userTags.includes('railway') && projectType.includes('railway')) {
        score += 25;
      }
      
      // Score metro projects
      if (userTags.includes('metro') && projectType.includes('metro')) {
        score += 25;
      }
      
      // Score port projects
      if (userTags.includes('transportation - port') && projectType.includes('port')) {
        score += 25;
      }
      
      // Score based on contract value
      if (userTags.includes('energy & power') && project["Contract Value"]) {
        score += 15;
      }
      
      // Score based on location match
      if (project.Location && companyLC.includes(project.Location.toLowerCase())) {
        score += 20;
      }
      
      return { project, score };
    });
  };
  
  // Generate local response (until DeepSeek API is integrated)
  const generateLocalResponse = (query, role, company, requirements, projectData) => {
    const queryLC = query.toLowerCase();
    let response = "";
    
    // Format the projects data
    const formatProjects = (projects) => {
      if (!projects || projects.length === 0) return "No matching projects found.";
      
      return projects.map((p, index) => 
        `**${index + 1}. ${p.Company || 'Unknown Company'}**: ${p.Title || 'Untitled Project'}\n` +
        `   • **Type**: ${p["Project Type"] || 'N/A'}\n` +
        `   • **Location**: ${p.Location || 'N/A'}\n` +
        `   • **Priority**: ${p.Urgency || 'Low'}\n` +
        `   • **Value**: ${p["Contract Value"] || p["Potential Value"] || 'Not specified'}\n` +
        (p["Steel Requirements"] ? `   • **Steel Requirements**: ${p["Steel Requirements"].substring(0, 150)}${p["Steel Requirements"].length > 150 ? '...' : ''}\n` : '')
      ).join('\n\n');
    };
    
    // Generate introduction based on query type
    if (queryLC.includes('prioritize') || queryLC.includes('important') || queryLC.includes('urgent')) {
      response = `## Top High-Priority Projects\n\nBased on your role as a ${role} at ${company}, I've identified the following high-priority projects that align with your requirements for ${requirements}:\n\n`;
      response += formatProjects(projectData.highPriorityProjects);
      response += "\n\n### Recommendation\nThese high-priority projects should be your focus due to their urgency and alignment with your requirements. Would you like more specific information about any of these projects?";
    } 
    else if (queryLC.includes('steel')) {
      response = `## Projects with Steel Requirements\n\nFor your role as ${role} at ${company} with interest in ${requirements}, here are the top projects involving steel:\n\n`;
      response += formatProjects(projectData.steelProjects);
      response += "\n\n### Analysis\nThese projects have significant steel components or requirements that match your interests. The steel requirements vary across projects, with some specifying particular grades or quantities. Consider prioritizing those that align most closely with your specific steel capabilities.";
    } 
    else if (queryLC.includes('value') || queryLC.includes('contract') || queryLC.includes('amount')) {
      response = `## Highest Value Projects\n\nAs a ${role} at ${company} interested in ${requirements}, here are the projects with the highest contract/potential value:\n\n`;
      response += formatProjects(projectData.valuableProjects);
      response += "\n\n### Value Analysis\nThese projects represent significant investment opportunities, with the highest values concentrated in infrastructure and energy sectors. The contract values indicate potential for substantial steel supply requirements.";
    } 
    else {
      response = `## Recommended Projects for ${company}\n\nBased on your role as ${role} and your interest in ${requirements}, I've analyzed all available projects and identified these top matches:\n\n`;
      response += formatProjects(projectData.recommendedProjects);
      response += "\n\n### Strategic Recommendation\nThese projects were selected based on their alignment with your specified interests and company profile. Consider prioritizing those with 'High' urgency levels, as they represent immediate opportunities. The projects span various sectors but all align with your specific requirements.";
    }
    
    return response;
  };
  
  // Intelligent lead recommendation based on user profile
  const generateRecommendations = (role, requirements, company) => {
    // Extract key information from user inputs
    const roleLC = role.toLowerCase();
    const requirementsLC = requirements.toLowerCase();
    const companyLC = company.toLowerCase();
    
    // Create a scoring system for projects
    const scoredProjects = filteredProjects.map(project => {
      let score = 0;
      
      // Score based on urgency
      if (project.Urgency?.toLowerCase() === 'high') score += 30;
      else if (project.Urgency?.toLowerCase() === 'medium') score += 15;
      
      // Score based on project type match with requirements
      const projectType = project["Project Type"]?.toLowerCase() || '';
      if (requirementsLC.includes('steel') && 
         (projectType.includes('steel') || 
          (project["Steel Requirements"] && project["Steel Requirements"].length > 10))) {
        score += 25;
      }
      
      // Score infrastructure projects for managers/directors
      if ((roleLC.includes('manager') || roleLC.includes('director') || roleLC.includes('executive')) && 
          projectType.includes('infrastructure')) {
        score += 20;
      }
      
      // Score railway projects
      if (requirementsLC.includes('railway') && projectType.includes('railway')) {
        score += 25;
      }
      
      // Score metro projects
      if (requirementsLC.includes('metro') && projectType.includes('metro')) {
        score += 25;
      }
      
      // Score port projects
      if (requirementsLC.includes('port') && projectType.includes('port')) {
        score += 25;
      }
      
      // Score based on contract value (if looking for high-value projects)
      if (requirementsLC.includes('high value') && project["Contract Value"]) {
        score += 15;
      }
      
      // Score based on location match
      if (project.Location && requirementsLC.includes(project.Location.toLowerCase())) {
        score += 20;
      }
      
      return { project, score };
    });
    
    // Sort by score and take top 3
    const topProjects = scoredProjects
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => {
        const p = item.project;
        return `• **${p.Company || 'Unknown Company'}**: ${p.Title || 'Untitled Project'}\n  ${p["Project Type"] || ''} | ${p.Location || ''} | ${p.Urgency || 'Low'} priority${p["Contract Value"] ? ` | Value: ${p["Contract Value"]}` : ''}`;
      })
      .join('\n\n');
    
    return topProjects || "No specific matches found based on your criteria. Try asking about specific project types or regions.";
  };
  
  // Helper to extract numeric values from currency strings
  const extractNumericValue = (valueStr) => {
    if (!valueStr) return 0;
    // Extract digits and decimals, ignore currency symbols and commas
    const matches = valueStr.match(/[0-9.]+/g);
    if (!matches) return 0;
    return parseFloat(matches.join(''));
  };
  
  // Helper function to suggest projects by exact type match
  const suggestProjectsByExactType = (projectType) => {
    const matchingProjects = filteredProjects
      .filter(p => {
        const normalizedProjectType = normalizeType(p["Project Type"] || "");
        return normalizedProjectType === projectType;
      })
      .slice(0, 3)
      .map(p => `• **${p.Company}**: ${p.Title}\n  ${p.Location || ''} | ${p.Urgency || 'Low'} priority${p["Contract Value"] ? ` | Value: ${p["Contract Value"]}` : ''}`)
      .join('\n\n');
      
    return `Here are the top ${projectType} projects:\n\n${matchingProjects || `No ${projectType} projects currently available.`}`;
  };
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);
  
  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-gray-50">
        <style jsx global>{`
          ${expandedStyles}
          
          /* Markdown styles */
          .markdown-content h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            color: #1f2937;
          }
          
          .markdown-content h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            color: #1f2937;
          }
          
          .markdown-content h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            color: #1f2937;
          }
          
          .markdown-content ul {
            list-style-type: disc;
            margin-left: 1rem;
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
          }
          
          .markdown-content ol {
            list-style-type: decimal;
            margin-left: 1rem;
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
          }
          
          .markdown-content p {
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
          }
          
          .markdown-content a {
            color: #2563eb;
            text-decoration: underline;
          }
          
          .markdown-content code {
            font-family: monospace;
            background-color: #f3f4f6;
            padding: 0.1rem 0.2rem;
            border-radius: 0.25rem;
          }
          
          .markdown-content pre {
            background-color: #f3f4f6;
            padding: 0.5rem;
            border-radius: 0.25rem;
            overflow-x: auto;
            margin: 0.5rem 0;
          }
          
          .markdown-content blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 0.5rem;
            margin-left: 0.5rem;
            color: #4b5563;
          }
        `}</style>
        
        <nav className="bg-gray-100 mb-6 shadow-lg shadow-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <span className="text-black text-xl font-semibold">JSW Steel Projects - Qualified News</span>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* No Projects Card */}
          {filteredProjects.length === 0 && (
            <div className="text-center mb-6" id="pipelineContainer">
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 sm:p-8">
                <div className="p-2 sm:p-5 text-center">
                  <h5 className="text-xl text-gray-800 font-semibold mb-4">No Qualified Projects Found</h5>
                  <button 
                    id="runPipelineBtn"
                    onClick={runPipeline}
                    disabled={isPipelineRunning}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    <FiRefreshCw className="mr-2" />
                    Run Pipeline
                  </button>
                  
                  {isPipelineRunning && (
                    <div className="mt-5 flex items-center justify-center">
                      <div className="inline-block w-4 h-4 border-2 rounded-full animate-spin mr-2 h-5 w-5 border-t-transparent border-gray-600"></div>
                      <span className="ml-2 text-gray-700">Pipeline is running...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Search and Filter Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-3 sm:p-5 text-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
                <div className="lg:col-span-4 sm:col-span-2">
                  <TextField
                    id="searchInput"
                    placeholder="Search projects, companies, locations..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FiSearch />
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
                
                <div className="lg:col-span-2 sm:col-span-1">
                  <FormControl fullWidth size="small">
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      id="priorityFilter"
                      value={priorityFilter}
                      label="Priority"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <FiFilter className="text-gray-400" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">All Priorities</MenuItem>
                      <MenuItem value="high">High Priority</MenuItem>
                      <MenuItem value="medium">Medium Priority</MenuItem>
                      <MenuItem value="low">Low Priority</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                
                <div className="lg:col-span-3 sm:col-span-1">
                  <FormControl fullWidth size="small">
                    <InputLabel id="project-type-label">Project Type</InputLabel>
                    <Select
                      labelId="project-type-label"
                      id="projectTypeFilter"
                      value={projectTypeFilter}
                      label="Project Type"
                      onChange={(e) => setProjectTypeFilter(e.target.value)}
                      disabled={availableProjectTypes.length === 0}
                      startAdornment={
                        <InputAdornment position="start">
                          <FiBriefcase className="text-gray-400" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">All Project Types</MenuItem>
                      {availableProjectTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className="lg:col-span-3 sm:col-span-2">
                  <FormControl fullWidth size="small">
                    <InputLabel id="sort-by-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-by-label"
                      id="sortBy"
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <FiCalendar className="text-gray-400" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">Default Sort</MenuItem>
                      <MenuItem value="priority-high">Priority (High to Low)</MenuItem>
                      <MenuItem value="priority-low">Priority (Low to High)</MenuItem>
                      <MenuItem value="date-new">Date (Newest First)</MenuItem>
                      <MenuItem value="date-old">Date (Oldest First)</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </div>
          </div>
          
          {filteredProjects.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              <button 
                onClick={runPipeline}
                disabled={isPipelineRunning}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium bg-gray-800 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`mr-2 ${isPipelineRunning ? 'animate-spin' : ''}`} />
                {isPipelineRunning ? 'Running...' : 'Run Pipeline'}
              </button>
            </div>
          )}
          
          <div className="overflow-x-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mr-2 border-t-transparent border-gray-600"></div>
                <h3 className="text-gray-700 text-xl font-medium mt-4">Loading Projects...</h3>
                <p className="text-gray-500 mt-2">Please wait while we fetch the latest data.</p>
              </div>
            )}
            
            {/* No Projects Message */}
            {!isLoading && filteredProjects.length === 0 && (
              <div id="noProjectsMessage" className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-md">
                <FiInfo className="mx-auto text-gray-400 text-5xl mb-3" />
                <h3 className="text-gray-700 text-xl font-medium">No Qualified Projects Found</h3>
                <p className="text-gray-500 mt-2">Run the pipeline to find new qualified projects.</p>
              </div>
            )}
            
            {/* Projects Table */}
            {!isLoading && filteredProjects.length > 0 && (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" id="projectsTable">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider text-center">#</th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project Details</th>
                          <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Business Info</th>
                          <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-20 sm:w-32">Analysis</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200" id="projectsTableBody">
                        {paginatedProjects.map((project, index) => (
                          <React.Fragment key={`project-${index}`}>
                            <tr 
                              id={`project-row-${index}`}
                              className="hover:bg-gray-50 transition-colors duration-150 expandable-row"
                              onClick={() => toggleRow(index)}
                            >
                              <td className="px-2 sm:px-4 py-3 text-sm text-center font-medium">{startIndex + index + 1}</td>
                              <td className="px-2 sm:px-6 py-3 text-sm">
                                <div className="space-y-1 max-w-[120px] sm:max-w-xs">
                                  <div className="text-sm font-medium text-gray-900 break-words sm-truncate mobile-wrap">{project.Title || ''}</div>
                                  {project["Project Type"] && (
                                    <div className="flex items-center mt-1">
                                      <FiBriefcase className="text-gray-500 mr-1 flex-shrink-0" size={14} />
                                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate">{project["Project Type"]}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400">{project["Date Published"] || ''}</div>
                                </div>
                              </td>
                              <td className="px-2 sm:px-3 py-3 text-sm">
                                <div className="space-y-1 max-w-[100px] sm:max-w-xs">
                                  <div className="text-sm font-medium text-gray-800 sm-truncate">{project.Company || ''}</div>
                                  <div className="text-sm text-gray-500 sm-truncate">{project.Location || ''}</div>
                                  {project["Target Company"] && (
                                    <div className="text-sm text-gray-500 mobile-hide">
                                      <span className="font-medium">Target:</span> {project["Target Company"]}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-1 sm:px-2 py-3 text-sm">
                                <div className="space-y-1 max-w-[90px] sm:max-w-xs">
                                  {project["Contract Value"] && (
                                    <div className="text-sm font-medium flex items-start">
                                      <span className="text-gray-600 whitespace-nowrap mobile-hide">Contract:</span> 
                                      <span className="text-gray-800 ml-1 mobile-wrap">{project["Contract Value"]}</span>
                                    </div>
                                  )}
                                  {project["Potential Value"] && (
                                    <div className="text-sm flex items-start">
                                      <span className="text-gray-600 whitespace-nowrap mobile-hide">Potential:</span>
                                      <span className="text-gray-800 ml-1 mobile-wrap">{project["Potential Value"]}</span>
                                    </div>
                                  )}
                                  {project["Steel Requirements"] && (
                                    <div className="text-sm text-gray-500 mobile-hide">
                                      <div className="flex flex-col">
                                        <span className="block truncate" title={project["Steel Requirements"]}>
                                          {project["Steel Requirements"].substring(0, 40)}{project["Steel Requirements"].length > 40 ? '...' : ''}
                                        </span>
                                        <button 
                                          className="text-xs text-left font-medium text-gray-500 hover:text-gray-800 focus:outline-none mt-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleRow(index);
                                          }}
                                        >
                                          Read more
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <div className="space-y-1 max-w-[80px] sm:max-w-[120px]">
                                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${
                                    project.Urgency?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                                    project.Urgency?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {project.Urgency || 'Low'}
                                  </span>
                                  {project.Reasoning && (
                                    <div className="text-xs text-gray-500 mobile-hide">
                                      <div className="flex flex-col">
                                        <span className="block truncate overflow-hidden">
                                          {project.Reasoning.substring(0, 40)}{project.Reasoning.length > 40 ? '...' : ''}
                                        </span>
                                        <button 
                                          className="text-xs text-left font-medium text-gray-500 hover:text-gray-800 focus:outline-none mt-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleRow(index);
                                          }}
                                        >
                                          Read more
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                            <tr key={`expanded-${index}`}>
                              <td colSpan="5" className="p-0 border-0">
                                <div id={`expanded-row-${index}`} className="expanded-content">
                                  <div className="p-3 sm:p-6 pb-4 sm:pb-8 border-t border-gray-100 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                      {/* Steel Requirements */}
                                      {project["Steel Requirements"] && (
                                        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <FiBriefcase className="mr-2 text-gray-500" size={16} />
                                            Steel Requirements
                                          </h4>
                                          <div className="text-sm text-gray-700">
                                            {project["Steel Requirements"]}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Analysis/Reasoning */}
                                      {project.Reasoning && (
                                        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <FiInfo className="mr-2 text-gray-500" size={16} />
                                            Project Analysis
                                          </h4>
                                          <div className="text-sm text-gray-700">
                                            {project.Reasoning}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Pagination */}
                {pageCount > 1 && (
                  <nav aria-label="Page navigation" className="mt-4 sm:mt-6 mb-6 sm:mb-8">
                    <ul className="flex flex-wrap items-center justify-center space-x-0 sm:space-x-1" id="pagination">
                      <li className="inline-block m-1 sm:m-0">
                        <a 
                          className={`px-2 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' : ''}`}
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                        >
                          Prev
                        </a>
                      </li>
                      
                      {[...Array(pageCount)].map((_, i) => (
                        <li key={i} className="inline-block m-1 sm:m-0">
                          <a 
                            className={`px-3 sm:px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 ${
                              currentPage === i + 1 
                                ? 'bg-gray-800 border-gray-800 text-white hover:bg-gray-700' 
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-100'
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </a>
                        </li>
                      ))}
                      
                      <li className="inline-block m-1 sm:m-0">
                        <a 
                          className={`px-2 sm:px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 ${currentPage === pageCount ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' : ''}`}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < pageCount) setCurrentPage(currentPage + 1);
                          }}
                        >
                          Next
                        </a>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>

        {/* Floating Chat Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Tooltip title={isChatOpen ? "Close chat" : "Get recommendations"}>
            <Button
              variant="contained"
              color="primary"
              onClick={toggleChat}
              sx={{
                borderRadius: '50%',
                minWidth: '56px',
                width: '56px',
                height: '56px',
                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)',
              }}
            >
              {isChatOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
            </Button>
          </Tooltip>
        </div>

        {/* Chat Modal */}
        {isChatOpen && (
          <div className="fixed bottom-10 right-6 z-50 w-80 sm:w-96">
            <Paper elevation={3} sx={{ 
              borderRadius: '12px', 
              overflow: 'hidden', 
              maxHeight: '500px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Chat Header */}
              <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <Avatar sx={{ bgcolor: '#4f46e5', width: 32, height: 32, marginRight: 1 }}>AI</Avatar>
                  <h3 className="font-medium">Project Advisor</h3>
                </div>
                <IconButton onClick={toggleChat} size="small" sx={{ color: 'white' }}>
                  <FiX />
                </IconButton>
              </div>
              
              {/* Chat Messages */}
              <div className="p-3 overflow-y-auto flex-grow" 
                   style={{ maxHeight: '300px' }}
                   ref={messagesContainerRef}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-2 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-gray-800 text-white rounded-tr-none' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      {msg.role === 'bot' ? (
                        <div className="markdown-content text-left max-w-[300px]">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < msg.content.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Context Input or Chat Input */}
              <div className="border-t p-3">
                {chatStage === 'role' && (
                  <div>
                    <TextField
                      fullWidth
                      label="Your role in the company"
                      variant="outlined"
                      size="small"
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      placeholder="e.g., Sales Manager, Business Development"
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      onClick={advanceToNextStage}
                      disabled={!userContext.trim()}
                      endIcon={<FiChevronRight />}
                    >
                      Continue
                    </Button>
                  </div>
                )}
                
                {chatStage === 'company' && (
                  <div className="flex items-center">
                    <TextField
                      fullWidth
                      placeholder="Your company and industry"
                      variant="outlined"
                      size="small"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <IconButton 
                      color="primary" 
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      sx={{ ml: 1 }}
                    >
                      <FiChevronRight />
                    </IconButton>
                  </div>
                )}
                
                {chatStage === 'tags' && (
                  <div>
                    <div className="mb-2 text-sm text-gray-600">Select project types you&apos;re interested in:</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableTags.map(tag => (
                        <div 
                          key={tag} 
                          onClick={() => toggleTag(tag)}
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            selectedTags.includes(tag) 
                              ? 'bg-gray-800 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      onClick={advanceToNextStage}
                      disabled={selectedTags.length === 0}
                      endIcon={<FiChevronRight />}
                    >
                      Continue
                    </Button>
                  </div>
                )}
                
                {chatStage === 'chat' && !isProcessingResponse && (
                  <div className="flex items-center">
                    <TextField
                      fullWidth
                      placeholder="Ask about specific projects or requirements..."
                      variant="outlined"
                      size="small"
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <IconButton 
                      color="primary" 
                      onClick={sendMessage}
                      disabled={!inputMessage.trim()}
                      sx={{ ml: 1 }}
                    >
                      <FiSend />
                    </IconButton>
                  </div>
                )}
                
                {isProcessingResponse && (
                  <div className="text-center py-2">
                    <div className="inline-block w-5 h-5 border-2 rounded-full animate-spin mr-2 border-t-transparent border-gray-600"></div>
                    <span className="text-gray-700">Processing response...</span>
                  </div>
                )}
              </div>
            </Paper>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
