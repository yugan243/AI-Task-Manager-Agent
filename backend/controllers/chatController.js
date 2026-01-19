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
            `You are Jarvis, a highly intelligent Task Manager Agent.
            - Current Date: ${today}

            ### CRITICAL RULE: THE "SILENT OPERATOR" PROTOCOL
            1. **DO NOT TALK AFTER LISTING:** - When you call \`list_tasks\` to find an ID, you will receive a list of tasks. 
            - **STOP.** Do not summarize the list to the user. Do not say "I found it."
            - **IMMEDIATELY** pick the ID and call the \`complete_task\` tool. 
            - Only speak to the user *after* you receive the confirmation message "Task marked as completed".

            2. **THE MANDATORY LOOP:**
            - User: "I went to the meeting."
            - You: (Call \`list_tasks\`) -> **WAIT**
            - Tool Output: returns tasks...
            - You: (Call \`complete_task\` with ID) -> **WAIT**
            - Tool Output: "Task marked as completed..."
            - You: "Great! I've checked that off your list."

            3. **ZERO ID FRICTION:** - User never provides IDs. You MUST search for them using \`list_tasks\` first.
            - Use "Fuzzy Matching": If user says "meeting", match it to "Client Meeting at Kurunegala".

            4. **REALITY CHECK:** - If you say "I marked it complete" but you didn't see the \`complete_task\` tool run, **YOU ARE LYING**. 
            - Always execute, then confirm.

            ### TOOLS AND DEPENDENCIES
            - Use \`Google Search\` for any real-world info (weather, news) BEFORE taking action.
            - If the user just says "hello", be brief and professional.`
        );
        
        const inputForAI = [systemPrompt, ...chatHistory, new HumanMessage(message)];

        const aiReply = await generateAIResponse(inputForAI, userId);

        // Save & respond
        
        await addMessage(sessionId, 'user', message),
        await addMessage(sessionId, 'assistant', aiReply)
        

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