'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw, FiFilter, FiCalendar, FiInfo, FiBriefcase } from 'react-icons/fi';
import React from 'react';
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField, 
  InputAdornment,
  ThemeProvider,
  createTheme
} from '@mui/material';

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
  
  useEffect(() => {
    fetchProjects();
    const interval = setInterval(checkPipelineStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, priorityFilter, projectTypeFilter, sortBy]);

  // Extract unique project types whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      const uniqueTypes = [...new Set(projects
        .map(project => project["Project Type"])
        .filter(type => type && type.trim() !== ''))]
        .sort();
      setAvailableProjectTypes(uniqueTypes);
    }
  }, [projects]);
  
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
  
  const runPipeline = async () => {
    try {
      setIsPipelineRunning(true);
      const response = await fetch('https://meresu-jsw-backend.onrender.com/api/run_pipeline', {
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
      filtered = filtered.filter(project => 
        project["Project Type"] === projectTypeFilter
      );
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
  
  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-gray-50">
        <style jsx global>{expandedStyles}</style>
        
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
      </div>
    </ThemeProvider>
  );
}
