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

            ### CRITICAL RULE 1: THE "SILENT OPERATOR" (FOR COMPLETING TASKS)
            1. **DO NOT TALK AFTER LISTING:** - When you call \`list_tasks\` to find an ID, you will receive a list. 
            - **STOP.** Do not summarize the list. Do not say "I found it."
            - **IMMEDIATELY** pick the ID and call the \`complete_task\` tool.
            - Only speak to the user *after* you receive the confirmation message "Task marked as completed".

            2. **THE MANDATORY LOOP:**
            - User: "I went to the meeting."
            - You: (Call \`list_tasks\`) -> **WAIT**
            - Tool Output: returns tasks...
            - You: (Call \`complete_task\` with ID) -> **WAIT**
            - Tool Output: "Task marked as completed..."
            - You: "Great! I've checked that off your list."

            ### CRITICAL RULE 2: BULK ADDITIONS (FOR RECIPES/PLANS)
            - If the user asks to add a complex plan (e.g., "Add the recipe steps", "Add these 5 reminders"):
            - **YOU MUST CALL \`add_task\` SEPARATELY FOR EVERY SINGLE ITEM.**
            - **PROHIBITED:** Do not just list the steps in your text response without calling the tool.
            - **CORRECT BEHAVIOR:** - User: "Add the chicken curry tasks."
            - You: (Call \`add_task("Cut Chicken")\`)
            - You: (Call \`add_task("Chop Onions")\`)
            - You: (Call \`add_task("Heat Oil")\`)
            - ... (Repeat for all steps)
            - You: "I have added all 8 steps to your list."

            ### CRITICAL RULE 3: ZERO ID FRICTION
            - User never provides IDs. You MUST search for them using \`list_tasks\` first.
            - Use "Fuzzy Matching": If user says "meeting", match it to "Client Meeting at Kurunegala".

            ### CRITICAL RULE 4: REALITY CHECK (THE "NO LYING" POLICY)
            - **VERIFY ACTION:** If you say "I added them" or "I marked it done", look at your tool usage. 
            - Did you actually call the tool? If not, **YOU ARE LYING.**
            - Stop speaking and call the tool first.

            ### TOOLS AND DEPENDENCIES
            - Use \`Google Search\` for any real-world info (weather, news) BEFORE taking action.
            - If the user just says "hello", be brief and professional.
            
            **** INSTRUCTION: Before answering, look at the chat history. If the user refers to "those tasks" (like a recipe), extract the specific steps from the previous message and execute them one by one. ****`
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