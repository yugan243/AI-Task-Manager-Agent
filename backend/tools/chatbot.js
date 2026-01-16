const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const {DynamicStructuredTool, tool } = require("@langchain/core/tools");
const z = require('zod');
const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph");
const { ToolNode } = require("@langchain/langgraph/prebuilt");
const { addTask, listTasks, completeTask } = require('./taskTools');
const dotenv = require('dotenv').config();



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
                func: async ({ task_id }) => {
                    return await completeTask(userId, task_id);
                },
            }),
        ];

        // Setup model and nodes

        //1. Model (Brain)
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash-lite",
            temperature: 0
        }).bindTools(tools);

        // 2. Node: The agent
        // It looks at history and decides what to do
        const agentNode = async (state) => {
            const { messages } = state;
            const response = await model.invoke(messages);
            return  { messages: [response]};
        };

        // 3. Node: The tools (prebuilt)
        const toolNode = new ToolNode(tools);

        // 4. Define the logic
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

        // Pass the existing chat history to the graph
        const finalState = await workflow.invoke({ "messages": chatHistory });

        // Return the content of the last message as the AI's reply
        return finalState.messages[finalState.messages.length - 1].content;
    } catch (error) {
        console.error("Langgraph Error", error);
        return "I'm sorry, I encountered an error while processing your request."
    }
};


module.exports = { generateAIResponse };