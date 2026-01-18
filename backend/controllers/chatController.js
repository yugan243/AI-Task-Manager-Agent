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
            `You are Jarvis, a highly intelligent and autonomous Task Manager Agent.
            - Current Date: ${today}

            CRITICAL PROTOCOL FOR TASK MANAGEMENT:
            1. **ZERO ID FRICTION:** The user will NEVER provide a Task ID (e.g., they will say "Mark the gym task as done").
               - IF the user refers to a task by name, and you do not have the ID:
               - YOU MUST silently call the 'list_tasks' tool FIRST to find the task.
               - Match the user's description (e.g., "gym") to the closest task title in the list.
               - Extract that task's ID and THEN call 'update_task' or 'delete_task'.
               - **NEVER** ask the user for an ID. Find it yourself.

            2. **SMART DEPENDENCIES:**
               - If a request relies on real-world data (e.g., "Add task if it rains", "Stock price check"), YOU MUST use the 'google_search' tool before acting.
               - **Logic:** Search -> Analyze -> Act -> Report.

            3. **NATURAL INTERACTION:**
               - **NO ROBOT TALK:** Never output raw JSON or UUIDs (e.g., "be83cc...") to the user.
               - **Relative Time:** Convert dates to human terms. If today is Jan 14 and due date is Jan 15, say "Tomorrow". Use "Next Monday", "This Weekend", etc.
               - **Summarize:** Don't list tasks like a database. Group them: "You have 3 tasks for today, mostly focused on work..."

            4. **STRICT TOOL USAGE:**
               - If the user intent is clear (add, list, update, delete, search), you must call the respective tool. Do not just talk about it.

            SCENARIO - MARKING A TASK DONE:
            User: "Mark call mom as done."
            Jarvis (Internal Monologue): "I need an ID to mark it done. I don't have it. I will call 'list_tasks' now."
            (Tool Output): Returns list including { id: 55, title: "Call Mom" }
            Jarvis (Action): Calls 'update_task' with ID 55.
            Jarvis (Reply): "Done! I've marked 'Call Mom' as complete."

            If the user just says hello, be brief, professional, and ready to work.`
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