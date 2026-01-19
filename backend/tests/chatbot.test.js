const request = require('supertest');

// --- 1. MOCK SUPABASE (Keep this, it's perfect) ---
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
};
jest.mock('../config/supabaseClient', () => mockSupabase);

// --- 2. MOCK THE AI MODULE (The Smart Version) ---
jest.mock('../tools/chatbot', () => ({
    generateAIResponse: jest.fn()
}));

// --- 3. MOCK DATABASE MODELS ---
jest.mock('../models/chatModel', () => ({
    getSessionHistory: jest.fn().mockResolvedValue([]),
    addMessage: jest.fn().mockResolvedValue({ id: 1, content: "ok" }),
    createSession: jest.fn().mockResolvedValue({ id: "test-session", title: "Test Chat" })
}));

const app = require('../server');
const { generateAIResponse } = require('../tools/chatbot');

describe('POST /chat Advanced Scenarios', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // SCENARIO 1: Basic Chat
    it('should handle a simple greeting', async () => {
        // Program the mock to act like a Chatbot
        generateAIResponse.mockImplementation((history, userId) => {
            return Promise.resolve("Hello! I am Jarvis. How can I help?");
        });

        const res = await request(app)
            .post('/chat')
            .send({
                userId: 'user-123',
                sessionId: 'test-session',
                message: 'Hi there'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.response).toContain("Hello! I am Jarvis");
    });

    // SCENARIO 2: Task Addition (Simulated)
    it('should respond correctly when adding a task', async () => {
        // Program the mock to act like it added a task
        generateAIResponse.mockImplementation((history, userId) => {
            // In a real test, we might check if 'history' contains the user prompt
            return Promise.resolve("I've added 'Buy Milk' to your task list.");
        });

        const res = await request(app)
            .post('/chat')
            .send({
                userId: 'user-123',
                sessionId: 'test-session',
                message: 'Add task to buy milk'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.response).toContain("I've added");
        expect(res.body.response).toContain("Buy Milk");
    });

    // SCENARIO 3: Error Handling
    it('should handle AI failures gracefully', async () => {
        generateAIResponse.mockRejectedValue(new Error("Rate Limit Exceeded"));

        const res = await request(app)
            .post('/chat')
            .send({
                userId: 'user-123',
                sessionId: 'test-session',
                message: 'Crash me'
            });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toBe("Rate Limit Exceeded");
    });
});