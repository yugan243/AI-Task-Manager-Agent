const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {DynamicStructuredTool } = require("@langchain/core/tools");
const z = require('zod');
const { addTask, listTasks, completeTask } = require('./taskTools');
const dotenv = require('dotenv').config();

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
        func: async ({ taskId }) => {
            return await completeTask(userId, taskId);
        },
    }),
];


// Intialize the model with the tools
const modelRaw = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0
})

// The main generator function
const generateAIResponse = async(chatHistory, userId) => {
    try {
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
                func: async ({ taskId }) => {
                    return await completeTask(userId, taskId);
                },
            }),
        ];

        // Bind tools to the model
        const modelWithTools = modelRaw.bindTools(tools);

        // Invoke the model
        const result = await modelWithTools.invoke(chatHistory);

        if (result.tool_calls && result.tool_calls.length > 0) {
            const toolCall = result.tool_calls[0];
            const selectedTool = tools.find(t => t.name === toolCall.name);

            if (selectedTool) {
                console.log(`AI decided to use the tool:, ${selectedTool.name}`);

                const toolOutput = await selectedTool.invoke(toolCall.args);
                return toolOutput; // Return the tool's result
            }
        }

        return result.content;
    } catch (error) {
        console.error("AI Tool error:", error);
        return "I'm sorry, I encountered an erro while processing your request."
    }
}


module.exports = { generateAIResponse };