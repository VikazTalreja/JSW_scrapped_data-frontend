'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw, FiFilter, FiCalendar, FiInfo, FiBriefcase } from 'react-icons/fi';

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
  const rowsPerPage = 10;
  
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
      
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Show a user-friendly error message
      alert('Failed to load projects. Please try again later.');
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
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{expandedStyles}</style>
      
      <nav className="bg-gray-100 mb-6 shadow-lg shadow-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-black text-xl font-semibold">JSW Steel Projects - Qualified News</span>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* No Projects Card */}
        {filteredProjects.length === 0 && (
          <div className="text-center mb-6" id="pipelineContainer">
            <div className="bg-white rounded-lg shadow-md overflow-hidden p-8">
              <div className="p-5 text-center">
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
          <div className="p-5 text-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-100 text-gray-700 rounded-l-md">
                    <FiSearch />
                  </span>
                  <input 
                    type="text" 
                    id="searchInput"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-gray-900"
                    placeholder="Search projects, companies, locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <div className="relative">
                  <select 
                    id="priorityFilter"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-gray-900 bg-white"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiFilter className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <div className="relative">
                  <select 
                    id="projectTypeFilter"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-gray-900 bg-white"
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    disabled={availableProjectTypes.length === 0}
                  >
                    <option value="">All Project Types</option>
                    {availableProjectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="relative">
                  <select 
                    id="sortBy"
                    className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-gray-900 bg-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Default Sort</option>
                    <option value="priority-high">Priority (High to Low)</option>
                    <option value="priority-low">Priority (Low to High)</option>
                    <option value="date-new">Date (Newest First)</option>
                    <option value="date-old">Date (Oldest First)</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {filteredProjects.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
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
          {/* No Projects Message */}
          {filteredProjects.length === 0 && (
            <div id="noProjectsMessage" className="text-center py-12 bg-white rounded-lg shadow-md">
              <FiInfo className="mx-auto text-gray-400 text-5xl mb-3" />
              <h3 className="text-gray-700 text-xl font-medium">No Qualified Projects Found</h3>
              <p className="text-gray-500 mt-2">Run the pipeline to find new qualified projects.</p>
            </div>
          )}
          
          {/* Projects Table */}
          {filteredProjects.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200" id="projectsTable">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider text-center">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Project Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Business Information</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value Assessment</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-32">Analysis</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200" id="projectsTableBody">
                      {paginatedProjects.map((project, index) => (
                        <>
                          <tr 
                            key={index} 
                            id={`project-row-${index}`}
                            className="hover:bg-gray-50 transition-colors duration-150 expandable-row"
                            onClick={() => toggleRow(index)}
                          >
                            <td className="px-0 py-4 text-sm text-center font-medium">{startIndex + index + 1}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="space-y-1 max-w-xs">
                                <div className="text-sm font-medium text-gray-900 break-words">{project.Title || ''}</div>
                                {project["Project Type"] && (
                                  <div className="flex items-center mt-1">
                                    <FiBriefcase className="text-gray-500 mr-1 flex-shrink-0" size={14} />
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate">{project["Project Type"]}</span>
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">{project["Date Published"] || ''}</div>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm">
                              <div className="space-y-1 max-w-xs">
                                <div className="text-sm font-medium text-gray-800">{project.Company || ''}</div>
                                <div className="text-sm text-gray-500 ">{project.Location || ''}</div>
                                {project["Target Company"] && (
                                  <div className="text-sm text-gray-500">
                                    <span className="font-medium">Target:</span> {project["Target Company"]}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-1 py-4 text-sm">
                              <div className="space-y-1 max-w-xs">
                                {project["Contract Value"] && (
                                  <div className="text-sm font-medium flex items-start">
                                    <span className="text-gray-600 whitespace-nowrap">Contract:</span> 
                                    <span className="text-gray-800 ml-1 ">{project["Contract Value"]}</span>
                                  </div>
                                )}
                                {project["Potential Value"] && (
                                  <div className="text-sm flex items-start">
                                    <span className="text-gray-600 whitespace-nowrap">Potential:</span>
                                    <span className="text-gray-800 ml-1 ">{project["Potential Value"]}</span>
                                  </div>
                                )}
                                {project["Steel Requirements"] && (
                                  <div className="text-sm text-gray-500">
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
                            <td className="px-4 py-4 text-sm">
                              <div className="space-y-1 max-w-[120px]">
                                <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mb-2 ${
                                  project.Urgency?.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                                  project.Urgency?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {project.Urgency || 'Low'}
                                </span>
                                {project.Reasoning && (
                                  <div className="text-xs text-gray-500">
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
                          <tr>
                            <td colSpan="5" className="p-0 border-0">
                              <div id={`expanded-row-${index}`} className="expanded-content">
                                <div className="p-6 pb-8 border-t border-gray-100 bg-gray-50">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Steel Requirements */}
                                    {project["Steel Requirements"] && (
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
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
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
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
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Pagination */}
              {pageCount > 1 && (
                <nav aria-label="Page navigation" className="mt-6 mb-8">
                  <ul className="flex items-center justify-center space-x-1" id="pagination">
                    <li className="inline-block">
                      <a 
                        className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' : ''}`}
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                      >
                        Previous
                      </a>
                    </li>
                    
                    {[...Array(pageCount)].map((_, i) => (
                      <li key={i} className="inline-block">
                        <a 
                          className={`px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 ${
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
                    
                    <li className="inline-block">
                      <a 
                        className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 ${currentPage === pageCount ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' : ''}`}
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
  );
}
