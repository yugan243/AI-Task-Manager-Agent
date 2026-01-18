"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, Sparkles, UserCircle, LogOut, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import TaskSidebar from "@/components/TaskSidebar";
import { supabase } from "@/lib/supabaseClient";

// --- 1. COMPONENT: Ambient Typewriter Overlay (With Intro) ---
const TypewriterOverlay = () => {
  const introMessage = "JARVIS, the AI powered Task Manager Agent.";

  const leftPhrases = [
    "Initializing Core Systems...",
    "Syncing Cloud Database...",
    "Encrypting Session Data...",
    "Optimizing Task Matrix...",
    "System Integrity: 100%..."
  ];

  const rightPhrases = [
    "Welcome back, Operator.",
    "Ready to organize your chaos.",
    "Focus mode: Standby.",
    "Awaiting your command.",
    "Let's get things done."
  ];

  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);
  
  // State: Are we playing the intro?
  const [isIntro, setIsIntro] = useState(true); 
  const [activeSide, setActiveSide] = useState("left");

  useEffect(() => {
    const handleTyping = () => {
      let fullText = "";
      
      if (isIntro) {
        fullText = introMessage;
      } else {
        const currentPhrases = activeSide === "left" ? leftPhrases : rightPhrases;
        const i = loopNum % currentPhrases.length;
        fullText = currentPhrases[i];
      }

      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1));
        setTypingSpeed(30);
      } else {
        setText(fullText.substring(0, text.length + 1));
        setTypingSpeed(50);
      }

      if (!isDeleting && text === fullText) {
        setTimeout(() => setIsDeleting(true), 2000); 
      } 
      else if (isDeleting && text === "") {
        setIsDeleting(false);
        if (isIntro) {
          setIsIntro(false);
          setActiveSide("right"); 
        } else {
          setLoopNum(loopNum + 1);
          setActiveSide(prev => prev === "left" ? "right" : "left");
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed, activeSide, isIntro]);

  return (
    <>
      {/* LEFT SIDE TEXT */}
      <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-64 hidden xl:block pointer-events-none">
        <div className={`transition-opacity duration-500 ${activeSide === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <p className="font-mono text-sm text-blue-900/40 uppercase tracking-widest font-bold mb-2">
            {isIntro ? "System Identity" : "System Log"}
          </p>
          <div className="text-2xl font-bold text-slate-800/60 font-mono min-h-[60px] leading-tight">
             {activeSide === 'left' ? text : ""}
             {activeSide === 'left' && <span className="animate-pulse ml-1 text-blue-500">_</span>}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE TEXT */}
      <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-64 text-right hidden xl:block pointer-events-none">
        <div className={`transition-opacity duration-500 ${activeSide === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          <p className="font-mono text-sm text-purple-900/40 uppercase tracking-widest font-bold mb-2">Assistant Feed</p>
          <div className="text-2xl font-bold text-slate-800/60 font-mono min-h-[60px] leading-tight">
             {activeSide === 'right' ? text : ""}
             {activeSide === 'right' && <span className="animate-pulse ml-1 text-purple-500">_</span>}
          </div>
        </div>
      </div>
    </>
  );
};

// --- 2. COMPONENT: Chat Typing Indicator ---
const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-4 bg-white/60 backdrop-blur-md w-fit rounded-2xl rounded-bl-sm border border-white/60 shadow-sm animate-in fade-in slide-in-from-bottom-1">
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
  </div>
);

export default function Home() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  
  // EMAIL FORM STATES
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const chatContainerRef = useRef(null);
  const API_URL = "http://localhost:5000";

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => scrollToBottom(), [messages, isLoading]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleUserAuthenticated(session.user);
    };
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) handleUserAuthenticated(session.user);
      else { setIsLoggedIn(false); setUser(null); setMessages([]); setTasks([]); }
    });
    return () => {
      authListener.subscription.unsubscribe();
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleUserAuthenticated = (currentUser) => {
    setUser(currentUser);
    setIsLoggedIn(true);
    initSession(currentUser.id);
    fetchTasks(currentUser.id);
  };

  const fetchTasks = async (currentUserId) => {
    try {
      const res = await axios.get(`${API_URL}/tasks?userId=${currentUserId}`);
      setTasks(res.data);
    } catch (error) { console.error("Fetch tasks failed:", error); }
  };

  const handleSocialLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider, options: { redirectTo: window.location.origin }
    });
    if (error) alert(`Login failed: ${error.message}`);
  };

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput) return;
    const { error } = await supabase.auth.signInWithOtp({ email: emailInput });
    if (error) {
      alert(error.message); 
    } else {
      setMagicLinkSent(true); 
    }
  };

  const resetEmailForm = () => {
    setShowEmailForm(false);
    setMagicLinkSent(false);
    setEmailInput("");
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const initSession = async (currentUserId) => {
    try {
      let savedSessionId = localStorage.getItem(`session_${currentUserId}`);
      if (!savedSessionId) {
        const res = await axios.post(`${API_URL}/sessions`, { userId: currentUserId });
        savedSessionId = res.data.id;
        localStorage.setItem(`session_${currentUserId}`, savedSessionId);
      }
      setSessionId(savedSessionId);
      const historyRes = await axios.get(`${API_URL}/sessions/${savedSessionId}/messages`);
      
      // If no history, keep empty for Hero Section
      if (historyRes.data && historyRes.data.length > 0) {
        setMessages(historyRes.data);
      } else {
        setMessages([]); 
      }

    } catch (error) { localStorage.removeItem(`session_${currentUserId}`); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/chat`, {
        userId: user.id, sessionId: sessionId, message: userMessage.content
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
      fetchTasks(user.id);
    } catch (error) { setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection Error" }]); } 
    finally { setIsLoading(false); }
  };

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

  const getDisplayName = () => {
    if (!user) return "Guest";
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full bg-slate-50 items-center justify-center relative overflow-hidden font-sans">
        
        {/* TYPEWRITER OVERLAY */}
        <TypewriterOverlay />

        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />

        <div className="z-10 bg-white/60 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/60 w-full max-w-md text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_5s_infinite_linear]"></div>
          
          <div className="flex justify-center mb-8 relative">
            <div className="p-5 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-600/20 text-white relative z-10">
              <Sparkles size={36} fill="white" className="animate-[spin_4s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
          </div>

          <h2 className="text-4xl text-slate-800 font-bold mb-3 tracking-tight">Jarvis <span className="text-blue-600">.</span></h2>
          <p className="text-slate-500 mb-10 text-[15px] font-medium leading-relaxed">
            Identity verification required.<br/>Select your protocol.
          </p>
          
          <div className="relative min-h-[220px]"> 
            {!showEmailForm ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                
                {/* Google Button (Rose-Orange Gradient) */}
                <button onClick={() => handleSocialLogin('google')} className="relative w-full group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)] hover:scale-[1.02]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-rose-400 to-orange-500 blur-sm scale-110" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-rose-500/80 to-orange-500/80" />
                  <div className="relative flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 group-hover:text-white transition-colors text-slate-700" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.23-7.27c3.46 0 6.64 1.98 6.64 1.98L21 4.59c0 0-3.66-3.32-9.13-3.32C5.35 1.27 0 6.55 0 12c0 5.45 5.35 10.73 11.87 10.73c6.88 0 11.85-4.8 11.85-11.45c0-.83 0-1.66-.18-2.18z" /></svg>
                    <span className="font-bold text-slate-600 group-hover:text-white transition-colors">Continue with Google</span>
                  </div>
                </button>

                {/* Facebook Button */}
                <button onClick={() => handleSocialLogin('facebook')} className="relative w-full group overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-transparent hover:shadow-[0_0_40px_-10px_rgba(24,119,242,0.4)] hover:scale-[1.02]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#0064e0] via-[#1877F2] to-[#42b72a] blur-sm scale-110" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#1877F2] to-[#00C6FF]" />
                  <div className="relative flex items-center justify-center gap-3">
                    <svg className="h-5 w-5 group-hover:text-white transition-colors text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.059v.913h3.945l-.526 3.667h-3.419v7.98h-4.844z" /></svg>
                    <span className="font-bold text-slate-600 group-hover:text-white transition-colors">Continue with Facebook</span>
                  </div>
                </button>
                
                <div className="relative py-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200/60"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-400 backdrop-blur-xl">Or continue with</span></div></div>
                <button onClick={() => setShowEmailForm(true)} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold py-4 rounded-2xl border border-transparent hover:border-slate-200 transition-all text-sm tracking-wide">Enter Email Address</button>
              </div>
            ) : (
              showEmailForm && !magicLinkSent ? (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input type="email" autoFocus placeholder="name@example.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-inner text-slate-700 font-medium placeholder:text-slate-400" />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all">Send Magic Link</button>
                  <button type="button" onClick={resetEmailForm} className="text-slate-400 hover:text-slate-600 text-sm font-medium flex items-center justify-center gap-2 py-2 transition-colors"><ArrowLeft size={16} /> Back to options</button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in zoom-in-95 duration-500">
                  <div className="relative"><div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse"></div><CheckCircle2 size={64} className="text-green-500 relative z-10" /></div>
                  <div className="text-center"><h3 className="text-xl font-bold text-slate-800">Check your Inbox!</h3><p className="text-slate-500 text-sm mt-2 max-w-[250px] mx-auto">We sent a magic link to <br/><span className="font-semibold text-slate-700">{emailInput}</span></p></div>
                  <div className="pt-2"><button onClick={resetEmailForm} className="text-blue-500 hover:text-blue-600 text-sm font-semibold hover:underline">Use a different email</button></div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
  return (
    <div className="flex h-screen w-full bg-[#F1F5F9] text-slate-800 font-sans overflow-hidden relative selection:bg-blue-100 selection:text-blue-900">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50"></div>
      <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply"></div>
      <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[100px] mix-blend-multiply"></div>

      <div className="relative z-20 h-full flex-none">
        <TaskSidebar tasks={tasks} toggleTask={toggleTask} deleteTask={deleteTask} />
      </div>

      <div className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-none h-24 px-8 flex justify-between items-center z-30">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/40 backdrop-blur-xl rounded-full border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:bg-white/60 transition-all cursor-default group">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white shadow-sm">
                <UserCircle size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold tracking-wider uppercase scale-90 origin-left">Operator</span>
                <span className="text-sm text-slate-700 font-bold tracking-tight group-hover:text-blue-600 transition-colors">
                  {getDisplayName()}
                </span>
              </div>
            </div>

            <button onClick={handleLogout} className="group relative px-5 py-2.5 rounded-full overflow-hidden shadow-lg shadow-rose-500/20 transition-all hover:scale-105 hover:shadow-rose-500/40 active:scale-95">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-orange-500 opacity-90 transition-opacity group-hover:opacity-100"></div>
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm group-hover:bg-transparent transition-all"></div>
              <div className="relative flex items-center gap-2 text-white font-semibold text-xs tracking-wide uppercase">
                <span>Sign Out</span>
                <LogOut size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
        </div>

        {/* Chat Area */}
        <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 pb-32">
          {messages.length === 0 ? (
            // Zero State Hero
            <div className="h-full flex flex-col items-center justify-center -mt-20 space-y-8 animate-in fade-in duration-700">
               <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 blur-3xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity duration-1000"></div>
                  <div className="p-8 bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-white/50 relative z-10">
                    <Sparkles size={64} className="text-transparent bg-clip-text bg-gradient-to-tr from-blue-600 to-purple-600 fill-blue-500/10 animate-[spin_12s_linear_infinite]" style={{ color: '#4F46E5' }} />
                  </div>
               </div>
               <div className="text-center space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Hi {getDisplayName().split(' ')[0]},</span>
                  </h1>
                  <p className="text-xl text-slate-500 font-medium">How can I help you organize your day?</p>
               </div>
            </div>
          ) : (
            // Chat List
            messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`relative max-w-[75%] px-6 py-4 rounded-3xl shadow-sm border
                  ${msg.role === "user" 
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm border-transparent shadow-blue-500/20" 
                    : "bg-white/70 backdrop-blur-md text-slate-700 rounded-bl-sm border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  }
                `}>
                  <p className={`whitespace-pre-wrap leading-relaxed text-[15px] ${msg.role === "assistant" ? "font-normal" : "font-medium"}`}>
                    {msg.content}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium opacity-60">
                  {msg.role === "user" ? "You" : "Jarvis"}
                </span>
              </div>
            ))
          )}
          {isLoading && <TypingIndicator />}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-center z-40 pointer-events-none">
          <form className="flex gap-2 w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-[0_8px_40px_-10px_rgba(0,0,0,0.1)] transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white pointer-events-auto" onSubmit={handleSendMessage}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent text-slate-800 px-6 py-3 outline-none placeholder-slate-400 font-medium text-[15px]" disabled={isLoading} />
            <button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-blue-600 text-white p-3.5 rounded-full transition-all shadow-md flex-shrink-0 active:scale-95">
              <Send size={18} fill="white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}