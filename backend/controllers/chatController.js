const { generateAIResponse } = require('../tools/chatbot');
const { getSessionHistory, addMessage, createSession } = require('../models/chatModel');
const supabase = require('../config/supabaseClient');
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");


const handleChat = async (req, res) => {
    const { message, sessionId } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({'error': "SessionID and message are required."});
    }

    try {
        // Verify session a& get user ID
        const {data: sessionData, error: sessionError } = await supabase
                                                                        .from('chat_sessions')
                                                                        .select('user_id')
                                                                        .eq('id', sessionId)
                                                                        .single();
        
        if (sessionError || !sessionData) {
            return res.status(404).json({ error: "Session not found. Please start a new chat."});
        }

        const userId = sessionData.user_id;

        // Fetch History
        const rawHistory = await getSessionHistory(sessionId, 20);
        const chatHistory = rawHistory.map(msg => {
            if (msg.role === 'user') return new HumanMessage(msg.content);
            return new AIMessage(msg.content);
        });

        // System prompt
        const today = new Date().toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
        const systemPrompt = new SystemMessage(
            `You are a friendly and efficient personal Task Manager Agent.
            - Current Date: ${today}

            CORE RULES:
            1. **Tool Usage:** If the user wants to add, list, or complete tasks, YOU MUST USE THE TOOLS.
            2. **Natural Language:** When a tool returns data (like a list of tasks), do NOT just copy-paste it. Read it, understand it, and summarize it conversationally.
            3. **NO UUIDs:** Never show the technical Task IDs (e.g., "be83cc...") to the user. Keep those hidden.
            4. **Relative Dates:** If a task is due "2026-01-15" and today is Jan 14, say "Tomorrow". If it's today, say "Today". Use natural terms like "Next Monday" or "Yesterday".

            EXAMPLE RESPONSES:
            - Bad: "- [id-123] Buy milk [Due: 2026-01-15]"
            - Good: "You have a few things on your plate. You need to buy milk by tomorrow, and don't forget to email John."
            
            If the user just says hello, reply warmly.`
        );
        
        const inputForAI = [systemPrompt, ...chatHistory, new HumanMessage(message)];

        const aiReply = await generateAIResponse(inputForAI, userId);

        // Save & respond
        await Promise.all([
            addMessage(sessionId, 'user', message),
            addMessage(sessionId, 'assistant', aiReply)
        ]);

        res.status(200).json({
            response: aiReply,
            sessionId: sessionId
        });

    } catch (err) {
        console.error("Controller Error:", err);
        return res.status(500).json({ 'error': err.message });
    }
}

const startSession = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({'error': "UserId is required."});

    try {
        const session = await createSession(userId, "New Chat");
        res.status(200).json(session);
    } catch (err) {
        res.status(500).json({'error': err.message});
    }
}

const getTasks =  async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserId is required." });

    try {
        const { data, error } = await supabase
                                            .from('tasks')
                                            .select('*')
                                            .eq('user_id', userId)
                                            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.log("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};


module.exports = { handleChat, startSession, getTasks };