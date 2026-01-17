"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Send, Loader2, User } from "lucide-react";
import TaskSidebar from "@/components/TaskSidebar";

export default function Home() {
  // --- STATE ---
  const [userId, setUserId] = useState(""); // No more hardcoding
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Controls the screen
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const API_URL = "http://localhost:5000";

  // --- 1. LOGIN HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setIsLoggedIn(true);
    // Trigger initial data fetch once we know who the user is
    initSession(userId);
    fetchTasks(userId);
  };

  // --- 2. SESSION & TASKS (Only runs after login) ---
  const initSession = async (currentUserId) => {
    try {
      // Check for existing session in browser
      let savedSessionId = localStorage.getItem(`session_${currentUserId}`);

      if (!savedSessionId) {
        // Create new session in Supabase
        const res = await axios.post(`${API_URL}/sessions`, { userId: currentUserId });
        savedSessionId = res.data.id;
        localStorage.setItem(`session_${currentUserId}`, savedSessionId);
      }

      setSessionId(savedSessionId);
      setMessages([{ role: "assistant", content: `Welcome back, ${currentUserId}. J.A.R.V.I.S. online.` }]);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Error connecting to server. Check console.");
      setIsLoggedIn(false);
    }
  };

  const fetchTasks = async (currentUserId) => {
    try {
      const res = await axios.get(`${API_URL}/tasks?userId=${currentUserId}`);
      setTasks(res.data);
    } catch (error) {
      console.error("Fetch tasks failed:", error);
    }
  };

  // --- 3. CHAT HANDLER ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        userId: userId,      // The REAL ID you typed
        sessionId: sessionId, 
        message: userMessage.content
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.data.response }]);
      fetchTasks(userId);

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Connection Error" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. TOGGLE TASK (Check/Uncheck)
  const toggleTask = async (taskId, currentStatus) => {
    try {
      // Optimistic Update: Update UI immediately so it feels fast
      setTasks(tasks.map(t => 
        t.id === taskId ? { ...t, is_completed: !t.is_completed } : t
      ));

      // Send to Backend
      await axios.patch(`${API_URL}/tasks/${taskId}/toggle`, {
        userId: userId,
        currentStatus: currentStatus
      });
      
      // No need to fetchTasks() if optimistic update worked, but good for safety
      fetchTasks(userId);
    } catch (error) {
      console.error("Failed to toggle:", error);
      alert("Failed to update task");
      fetchTasks(userId); // Revert UI on error
    }
  };

// 5. DELETE TASK
  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task permanently?")) return;

    try {
      // Optimistic Update
      setTasks(tasks.filter(t => t.id !== taskId));

      // Send to Backend (Note: axios.delete takes 'data' in a config object)
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        data: { userId: userId } 
      });

    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Could not delete task");
      fetchTasks(userId);
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-96">
          <div className="flex justify-center mb-6 text-blue-500">
            <User size={48} />
          </div>
          <h2 className="text-2xl text-white text-center mb-6 font-bold">Identity Verification</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">User ID (from Database)</label>
              <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g., cdd2eab0-bbd4..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
            >
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
      <TaskSidebar tasks={tasks} toggleTask={toggleTask} deleteTask={deleteTask} />

      <div className="flex-1 flex flex-col bg-gray-900/50">
        {/* Chat Area */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] p-5 rounded-3xl shadow-md ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200 border border-gray-700"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && <Loader2 className="animate-spin text-blue-500 ml-4" />}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gray-900 border-t border-gray-800">
          <form className="flex gap-4 max-w-4xl mx-auto relative" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command J.A.R.V.I.S..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-2xl pl-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading} className="absolute right-3 top-3 text-white p-2">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}