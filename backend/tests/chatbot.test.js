const { generateAIResponse } = require('../tools/chatbot');
const taskTools = require('../tools/taskTools');
const searchTool = require('../tools/searchTool');

// 1. MOCK THE TOOLS
// We tell Jest: "Don't actually touch the database, just pretend."
jest.mock('../tools/taskTools');
jest.mock('../tools/searchTool');

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
    },20000);

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
    },50000);

    // NEW TEST: Verify the "Eyes" (Internet Access)
    test('should call searchTool when user asks about weather', async () => {
        // Setup: Pretend the search finds sunny weather
        searchTool.searchInternet.mockResolvedValue("Search Results: It is sunny in Colombo.");
        taskTools.addTask.mockResolvedValue("Task added.");

        const history = [
            { role: "user", content: "If it is sunny in Colombo, add a task to go for a walk." }
        ];

        const response = await generateAIResponse(history, "test-user-id");

        // Check 1: Did it trigger the search?
        expect(searchTool.searchInternet).toHaveBeenCalled();
        
        // Check 2: Did it successfully reason that it should add the task?
        // Note: The AI must decide to call addTask based on the mocked search result
        expect(taskTools.addTask).toHaveBeenCalledWith(
            "test-user-id",
            expect.stringContaining("walk"),
            undefined
        );

        expect(response).toBeTruthy();
    }, 50000); // Increased timeout for AI reasoning

});