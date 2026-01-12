
const { createSession, addMessage, getSessionHistory } = require('./models/chatModel');


const TEST_USER_ID = '218a4803-ecfd-41e7-b763-fdfaf03bbc8e'; 

const runTest = async () => {
    console.log("1. Creating a new session...");
    try {
        // Step 1: Create a Session
        const session = await createSession(TEST_USER_ID, "Test Session 2");
        console.log("Session Created:", session);
        const sessionId = session.id;

        // Step 2: Add a User Message
        console.log("\n2. Adding User Message...");
        await addMessage(sessionId, 'user', 'I\m good, thank you!');
        console.log("User Message Added");

        // Step 3: Add an AI Message
        console.log("\n3. Adding AI Message...");
        await addMessage(sessionId, 'assistant', 'nice');
        console.log("AI Message Added");

        // Step 4: Fetch History
        console.log("\n4. Fetching History (Sliding Window)...");
        const history = await getSessionHistory(sessionId);
        console.log("History Retrieved:", history);

    } catch (error) {
        console.error("Error:", error);
    }
};

runTest();