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
            `You are a helpful Taks Manager Agent. 
            - Current Date: ${today}.
            - If the user asks to add, list, or completed tasls, USE YOUR TOOLS.
            - If the user just says hello or asks a question, reply normally without using tools.
            - When listing tasks, keep it clean and concise.`
        )
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


module.exports = { handleChat, startSession };