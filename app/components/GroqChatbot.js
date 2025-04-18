'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  TextField,
  Button,
  IconButton,
  Avatar,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  FiMessageCircle, 
  FiX, 
  FiSend, 
  FiBriefcase,
  FiUser,
  FiCopy
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

export default function GroqChatbot({ projects, availableProjectTypes }) {
  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [projectsData, setProjectsData] = useState([]);

  // Add ref for message container
  const messagesContainerRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  useEffect(() => {
    // Process projects into a usable format when they change
    if (projects && projects.length > 0) {
      // Create a cleaned, simplified version of the projects
      const processedProjects = projects.map((project, index) => ({
        id: index + 1,
        company: project.Company || 'Unknown company',
        title: project.Title || 'Unnamed project',
        location: project.Location || 'Unknown location',
        projectType: project['Project Type'] || 'Unspecified type',
        contractValue: project['Contract Value'] || 'Unknown value',
        potentialValue: project['Potential Value'] || 'Unknown potential',
        steelRequirements: project['Steel Requirements'] || 'Not specified',
        urgency: project.Urgency || 'Not specified'
      }));
      setProjectsData(processedProjects);
    }
  }, [projects]);

  // Toggle chat visibility
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    
    // Focus on input when chat is opened
    if (!isChatOpen) {
      setTimeout(() => {
        const inputElement = document.getElementById(isFormCompleted ? 'chat-input' : 'role-input');
        if (inputElement) inputElement.focus();
      }, 300);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    if (!userRole.trim() || !userCompany.trim()) return;
    setIsFormCompleted(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  // Send message
  const sendMessage = () => {
    if (!inputMessage.trim() || isProcessingResponse) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    
    // Generate response using Groq
    setIsProcessingResponse(true);
    setBotThinking(true);
    fetchGroqResponse(inputMessage);
  };
  
  // Fetch response from Groq API
  const fetchGroqResponse = async (query) => {
    try {
      // Create a clean project summary to include in the system prompt
      const projectSummary = projectsData.map(p => 
        `Project ${p.id}: ${p.company} - ${p.title || 'Unnamed project'} (${p.location}, Value: ${p.contractValue})`
      ).join('\n');
      
      // Full project details as structured data
      const detailedProjects = projectsData.map(p => ({
        id: p.id,
        company: p.company,
        title: p.title,
        location: p.location,
        projectType: p.projectType,
        contractValue: p.contractValue,
        potentialValue: p.potentialValue,
        urgency: p.urgency,
        steelRequirements: p.steelRequirements
      }));

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            role: 'system',
            content: `**Role**: You are a senior project advisor specializing in steel procurement and construction project management, with 20+ years of experience in blast furnace operations and structural steel applications.  

**User Context**:  
- Role: ${userRole} (e.g., Procurement Manager, Structural Engineer)  
- Company: ${userCompany} (e.g., ArcelorMittal, China Railway Construction Corp)  

**Available Projects**:  
${projectSummary}  
  
**Analysis Requirements**:  
1. For each project, evaluate:  
   - Steel tonnage requirements vs. ${userCompany}&apos;s production capacity  
   - Contract value relative to company&apos;s average project size  
   - Geographic proximity to company&apos;s existing operations/supply chains  
   - Compliance with company&apos;s specialty (e.g., high-tensile steel, bridge construction)  

2. Prioritization must consider:  
    - always Give Reasons Why you are recommending a project 
   - Profit margin potential (USD/ton)  
   - Strategic value (market expansion, long-term client potential)  
   - ${userRole}-specific KPIs (cost savings, safety improvements, etc.)  
`}, {
            role: 'user',
            content: query
          }],
          projects: detailedProjects
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the message content from the Groq API response format
      let botResponse = "";
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        botResponse = data.choices[0].message.content;
      } else if (data && data.response) {
        // Fallback to original format if available
        botResponse = data.response;
      } else {
        botResponse = "I'm sorry, I couldn't process your request properly.";
      }
      
      // Add response to chat
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: botResponse,
        projects: data.topProjects || []
      }]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Error fetching Groq response:', error);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "I'm sorry, I encountered an error while processing your request. Please try again." 
      }]);
    } finally {
      setIsProcessingResponse(false);
      setBotThinking(false);
    }
  };
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      const element = messagesContainerRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);
  
  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isFormCompleted) {
        sendMessage();
      } else if (userRole.trim() && userCompany.trim()) {
        handleFormSubmit();
      }
    }
  };
  
  // Copy response to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show some feedback
        alert("Copied to clipboard!");
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Tooltip title={isChatOpen ? "Close chat" : "Open Project Advisor"}>
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

      {/* Copilot-style Chat Panel */}
      <div 
        ref={chatContainerRef}
        className={`fixed top-0 right-0 h-full bg-white z-50 shadow-xl transition-all duration-300 border-l border-gray-200 flex flex-col ${
          isChatOpen ? 'w-[30%]' : 'w-0 opacity-0'
        }`}
        style={{
          minWidth: isChatOpen ? '380px' : '0',
          maxWidth: '600px'
        }}
      >
        {/* Chat Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Avatar 
              sx={{ 
                bgcolor: '#0c4a6e', 
                width: 38, 
                height: 38, 
                marginRight: 1.5
              }}
            >
              <FiMessageCircle size={20} />
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900"> Project Advisor</h3>
              {/* <div className="text-xs text-gray-500">Powered by Groq AI</div> */}
            </div>
          </div>
          <IconButton onClick={toggleChat} size="small" sx={{ color: '#64748b' }}>
            <FiX size={20} />
          </IconButton>
        </div>
        
        {!isFormCompleted ? (
          // User Information Form
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Welcome to JSW Project Advisor</h4>
              <div>
                <div className="flex items-center mb-2">
                  <FiUser className="text-gray-500 mr-2" />
                  <div className="text-sm font-medium text-gray-600">What&apos;s your role in the company?</div>
                </div>
                <TextField
                  id="role-input"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Sales Manager, Director, CEO"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </div>
              <div>
                <div className="flex items-center mb-2">
                  <FiBriefcase className="text-gray-500 mr-2" />
                  <div className="text-sm font-medium text-gray-600">Which company do you represent?</div>
                </div>
                <TextField
                  id="company-input"
                  fullWidth
                  placeholder="Your company and industry"
                  variant="outlined"
                  size="small"
                  value={userCompany}
                  onChange={(e) => setUserCompany(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </div>
              <Button 
                variant="contained"
                fullWidth
                onClick={handleFormSubmit}
                disabled={!userRole.trim() || !userCompany.trim()}
                sx={{
                  mt: 2,
                  backgroundColor: '#0c4a6e',
                  '&:hover': {
                    backgroundColor: '#0e7490',
                  }
                }}
              >
                Start Chat
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-gray-50" 
              ref={messagesContainerRef}
            >
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-6 ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                  {/* Message header with avatar */}
                  <div className={`flex items-center mb-1.5 ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                    {msg.role !== 'user' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: '#0c4a6e', 
                          width: 28, 
                          height: 28, 
                          marginRight: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        G
                      </Avatar>
                    )}
                    <div className="text-xs text-gray-500 font-medium">
                      {msg.role === 'user' ? 'You' : 'Groq Advisor'}
                    </div>
                    {msg.role === 'user' && (
                      <Avatar 
                        sx={{ 
                          bgcolor: '#64748b', 
                          width: 28, 
                          height: 28, 
                          marginLeft: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        Y
                      </Avatar>
                    )}
                  </div>
                  
                  {/* Message content */}
                  <div className={`max-w-[90%] rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 text-gray-800 p-3' 
                      : 'bg-white border border-gray-200 p-3 shadow-sm'
                  }`}>
                    {msg.role === 'bot' ? (
                      <div className="markdown-content text-gray-800 text-sm">
                        <ReactMarkdown>
                          {msg.content || ''}
                        </ReactMarkdown>
                        
                        {/* Action buttons for bot messages */}
                        {msg.content && msg.content.length > 100 && (
                          <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                            <Tooltip title="Copy to clipboard">
                              <IconButton 
                                size="small" 
                                onClick={() => copyToClipboard(msg.content)}
                                sx={{ color: '#64748b' }}
                              >
                                <FiCopy size={14} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm">
                        {(msg.content || '').split('\n').map((line, i) => (
                          <div key={i}>
                            {line}
                            {i < (msg.content || '').split('\n').length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* "Bot is thinking" indicator */}
              {botThinking && (
                <div className="flex items-start mb-6">
                  <Avatar 
                    sx={{ 
                      bgcolor: '#0c4a6e', 
                      width: 28, 
                      height: 28, 
                      marginRight: 1,
                      fontSize: '0.8rem'
                    }}
                  >
                    G
                  </Avatar>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[90%] shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Analyzing project data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Section */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-start">
                <TextField
                  id="chat-input"
                  fullWidth
                  placeholder="Ask about specific projects or requirements..."
                  variant="outlined"
                  size="small"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  multiline
                  maxRows={4}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  sx={{ 
                    ml: 1,
                    minWidth: '42px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#0c4a6e',
                    '&:hover': {
                      backgroundColor: '#0e7490',
                    }
                  }}
                >
                  <FiSend size={18} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
} 