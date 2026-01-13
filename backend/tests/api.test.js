const request = require('supertest');
const app = require('../server'); // Import your Express App

// We will store the session ID here to use it in step 2
let createdSessionId;
const TEST_USER_ID = process.env.TEST_USER_ID || '218a4803-ecfd-41e7-b763-fdfaf03bbc8e';

describe('AI Task Manager API Tests', () => {

    // Test 1: Can we create a session?
    it('POST /sessions should create a new chat session', async () => {
        const res = await request(app)
            .post('/sessions')
            .send({ userId: TEST_USER_ID });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        
        // Save the ID for the next test
        createdSessionId = res.body.id;
        console.log("Test Session ID:", createdSessionId);
    });

    // Test 2: Can we talk to the bot?
    // Note: We increase timeout to 10 seconds because AI takes time to think
    it('POST /chat should return an AI response', async () => {
        const res = await request(app)
            .post('/chat')
            .send({
                sessionId: createdSessionId,
                message: "Hello, this is an automated test."
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('response');
        expect(res.body.response).toBeTruthy(); // Ensure response is not empty
    }, 10000); // 10000ms timeout
});