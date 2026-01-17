"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Send, Loader2, LogIn, LogOut, Mail } from "lucide-react";
import TaskSidebar from "@/components/TaskSidebar";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  const API_URL = "http://localhost:5000";

  // --- 1. AUTHENTICATION LISTENER ---
  useEffect(() => {
    // Check active session on load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleUserAuthenticated(session.user);
    };
    checkUser();

    // Listen for login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleUserAuthenticated(session.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setMessages([]);
        setTasks([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleUserAuthenticated = (currentUser) => {
    setUser(currentUser);
    setIsLoggedIn(true);
    initSession(currentUser.id);
    fetchTasks(currentUser.id);
  };

  // --- LOGIN HANDLERS ---
  
  const handleSocialLogin = async (provider) => {
    // This will redirect the user to Google or Facebook login page
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin // Returns to localhost:3000 after login
      }
    });
    if (error) alert(`Login failed: ${error.message}`);
  };

  const handleEmailLogin = async () => {
    const email = prompt("Enter your email address:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert(`Login link sent to ${email}!`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- 2. SESSION & TASKS LOGIC ---
  const initSession = async (currentUserId) => {
    try {
      let savedSessionId = localStorage.getItem(`session_${currentUserId}`);
      if (!savedSessionId) {
        const res = await axios.post(`${API_URL}/sessions`, { userId: currentUserId });
        savedSessionId = res.data.id;
        localStorage.setItem(`session_${currentUserId}`, savedSessionId);
      }
      setSessionId(savedSessionId);
      if (messages.length === 0) setMessages([{ role: "assistant", content: `Welcome back.` }]);
    } catch (error) { console.error(error); }
  };

  const fetchTasks = async (currentUserId) => {
    try {
      const res = await axios.get(`${API_URL}/tasks?userId=${currentUserId}`);
      setTasks(res.data);
    } catch (error) { console.error(error); }
  };

  // --- 3. CHAT LOGIC ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat`, {
        userId: user.id,
        sessionId: sessionId, 
        message: userMessage.content
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
      fetchTasks(user.id);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection Error" }]);
    } finally { setIsLoading(false); }
  };

  // --- TOOLS LOGIC ---
  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !task.is_completed } : t));
      await axios.patch(`${API_URL}/tasks/${taskId}/toggle`, { userId: user.id, currentStatus: task.is_completed });
    } catch (error) { fetchTasks(user.id); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete permanently?")) return;
    try {
      setTasks(tasks.filter(t => t.id !== taskId));
      await axios.delete(`${API_URL}/tasks/${taskId}`, { data: { userId: user.id } });
    } catch (error) { fetchTasks(user.id); }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen bg-black items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md text-center shadow-2xl">
          <div className="flex justify-center mb-6 text-blue-500">
            <LogIn size={56} />
          </div>
          <h2 className="text-3xl text-white font-bold mb-2">J.A.R.V.I.S. Access</h2>
          <p className="text-gray-400 mb-8">Authenticate identity to proceed.</p>
          
          <div className="space-y-4">
            {/* GOOGLE BUTTON */}
            <button 
              onClick={() => handleSocialLogin('google')} 
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.23-7.27c3.46 0 6.64 1.98 6.64 1.98L21 4.59c0 0-3.66-3.32-9.13-3.32C5.35 1.27 0 6.55 0 12c0 5.45 5.35 10.73 11.87 10.73c6.88 0 11.85-4.8 11.85-11.45c0-.83 0-1.66-.18-2.18z"/></svg>
              Continue with Google
            </button>
            
            {/* FACEBOOK BUTTON */}
            <button 
              onClick={() => handleSocialLogin('facebook')} 
              className="w-full bg-[#1877F2] hover:bg-[#155db2] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.059v.913h3.945l-.526 3.667h-3.419v7.98h-4.844z"/></svg>
              Continue with Facebook
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-gray-700 flex-1"></div>
              <span className="text-gray-500 text-sm">OR</span>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>

            {/* EMAIL MAGIC LINK */}
            <button 
              onClick={handleEmailLogin} 
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-700"
            >
              <Mail size={18} /> Send Login Link to Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
      <TaskSidebar tasks={tasks} toggleTask={toggleTask} deleteTask={deleteTask} />
      <div className="flex-1 flex flex-col bg-gray-900/50">
        <div className="p-4 flex justify-between items-center border-b border-gray-800/50">
            <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
              IDENTITY: {user?.email}
            </span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-white flex items-center gap-2 text-sm transition-colors">
                <LogOut size={16}/> Disconnect
            </button>
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-800">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-5 rounded-3xl shadow-lg ${
                msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none"
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex items-center gap-2 ml-4 text-blue-400"><Loader2 className="animate-spin" size={20} /> <span className="text-sm">Processing...</span></div>}
        </div>

        <div className="p-6 bg-gray-900 border-t border-gray-800">
          <form className="flex gap-4 max-w-4xl mx-auto relative" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Awaiting command..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-2xl pl-6 py-4 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading} className="absolute right-3 top-3 text-white p-2 hover:text-blue-400 transition-colors">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}