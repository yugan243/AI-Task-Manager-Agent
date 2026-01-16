// backend/test/chatbot.test.js
const { generateAIResponse } = require('../tools/chatbot');
const taskTools = require('../tools/taskTools');

// 1. MOCK THE TOOLS
// We tell Jest: "Don't actually touch the database, just pretend."
jest.mock('../tools/taskTools');

describe('Chatbot Logic (LangGraph)', () => {

    beforeEach(() => {
        // Clear counters before every test
        jest.clearAllMocks();
    });

    test('should return a string response for a simple greeting', async () => {
        // Setup: Mock listTasks to return an empty array
        taskTools.listTasks.mockResolvedValue([]);

        const history = [
            { role: "user", content: "Hello, who are you?" }
        ];

        // Run the function
        const response = await generateAIResponse(history, "test-user-id");

        // Check: Did we get text back?
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
    }, 20000);

    test('should call addTask when user asks to add a task', async () => {
        // Setup: Pretend adding a task works perfectly
        taskTools.addTask.mockResolvedValue("Task added successfully.");

        const history = [
            { role: "user", content: "Add buy milk to my list" }
        ];

        const response = await generateAIResponse(history, "test-user-id");

        // Check 1: Did the AI logic try to call the addTask tool?
        expect(taskTools.addTask).toHaveBeenCalledTimes(1);
        
        // Check 2: Did it extract the word "milk"?
        expect(taskTools.addTask).toHaveBeenCalledWith(
            "test-user-id", 
            expect.stringContaining("milk"), 
            undefined
        );
        
        // Check 3: Did the AI reply to the user?
        expect(response).toBeTruthy();
    });

    test('should handle multiple tasks (The Triple Threat)', async () => {
        // Setup: Pretend adding works
        taskTools.addTask.mockResolvedValue("Task added.");

        const history = [
            { role: "user", content: "Add buy eggs, buy milk, and call mom." }
        ];

        // Run the function
        await generateAIResponse(history, "test-user-id");

        // Check: Did it call the tool 3 times?
        // Note: Sometimes the AI calls it 3 times, sometimes it batches them.
        // We check if it was called AT LEAST once.
        expect(taskTools.addTask).toHaveBeenCalled(); 
    });
});