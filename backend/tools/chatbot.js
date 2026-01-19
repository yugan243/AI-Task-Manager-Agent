const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const z = require('zod');
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { addTask, listTasks, completeTask } = require('./taskTools'); 
const { searchInternet } = require('./searchTool');
const KeyManager = require('../config/keyPool'); 
const dotenv = require('dotenv').config();


// The main generator function
const generateAIResponse = async (chatHistory, userId) => {
    // Total retries = Total Keys * Total Models. 
    // Example: 10 keys * 2 models = 20 max attempts.
    const maxAttempts = KeyManager.getMaxAttempts();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 1. Get the globally active config
        const { apiKey, modelName, debugId } = KeyManager.getCurrentConfig();
        
        try {
            console.log(`[Attempt ${attempt + 1}] Using: ${debugId}`);

            // --- Define Tools ---
        const tools = [
            new DynamicStructuredTool({
                name: "add_task",
                description: "Adds a new task to the user's todo list. Extract the due date if mentioned.",
                schema: z.object({
                    taskContent: z.string().describe("The content of tehtask to add"),
                    dueDate: z.string().optional().describe("Optional ISO date string (e.g. 2023-10-27) if a time is mentioned.")
                }),
                func: async({taskContent, dueDate}) => {
                    return await addTask(userId, taskContent, dueDate);
                }
            }),
            new DynamicStructuredTool({
                name: "list_tasks",
                description: "Lists all pending tasks for the current user.",
                schema: z.object({}),
                func: async() => {
                    return await listTasks(userId);
                }
            }),
            new DynamicStructuredTool({
                name: "complete_task",
                description: "Marks a task as completed using its ID.",
                schema: z.object({
                    task_id: z.string().describe("The UUID of the task to complete")
                }),
                func: async ({ task_id }) => {
                    return await completeTask(userId, task_id);
                },
            }),
            new DynamicStructuredTool({
                name: "google_search",
                description: "Searches the internet for real-time info (weather, news, facts). Use this BEFORE adding a task if the user's request depends on external conditions (e.g., 'If it rains...').",
                schema: z.object({
                    query: z.string().describe("The search query, e.g., 'weather in Colombo tomorrow'")
                }),
                func: async ({ query }) => await searchInternet(query)
            }),
        ];

            // 1. Initialize Model
            const model = new ChatGoogleGenerativeAI({
                apiKey: apiKey,
                model: modelName,
                temperature: 0
            }).bindTools(tools);

            // 2. Build & Execute Graph
            const agentNode = async (state) => {
                const { messages } = state;
                const response = await model.invoke(messages);
                return { messages: [response] };
            };
            const toolNode = new ToolNode(tools);

            const shouldContinue = (state) => {
                const { messages } = state;
                const lastMessage = messages[messages.length - 1];
                
                if (lastMessage.tool_calls?.length) {
                    return "tools";
                }

                return "__end__";
            }

            // Build the graph
            const workflow = new StateGraph(MessagesAnnotation)
                .addNode("agent", agentNode)
                .addNode("tools", toolNode)
                .addEdge("__start__", "agent")
                .addConditionalEdges(
                    "agent",
                    shouldContinue,
                    {
                        tools: "tools",
                        __end__: "__end__"
                    }
                )
                .addEdge("tools", "agent")
                .compile();

            const finalState = await workflow.invoke({ "messages": chatHistory });
            
            // We return immediately. The global state REMAINS on this key 
            // so the next user uses this same working key/model.
            return finalState.messages[finalState.messages.length - 1].content;

        } catch (error) {
            // --- CHECK FOR RATE LIMITS ---
            const isRateLimit = error.message.includes("429") || 
                                error.message.includes("quota") || 
                                error.message.includes("Resource has been exhausted");

            if (isRateLimit) {
                console.warn(`Quota Hit on ${debugId}. Triggering Global Rotation...`);
                
                // ACTION: Rotate the Global State immediately.
                // The next loop iteration (and the next User) will use the new config.
                KeyManager.rotate(); 
                
                continue; // Retry loop with new key
            } else {
                // Non-retryable error (logic bug, network down, etc)
                console.error(" Critical Error:", error);
                return "I encountered an internal system error.";
            }
        }
    }

    return "System Overload: All available AI models are currently busy. Please try again in few minutes.";
};

module.exports = { generateAIResponse };