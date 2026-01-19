const express = require('express');
const cors = require('cors');
const app = express();

const path = require('path');
const chatController = require('./controllers/chatController');
const chatModel = require('./models/chatModel');
const { deleteTask, toggleTaskCompletion } = require('./tools/taskTools');

const PORT = process.env.PORT || 10000;

const corsOptions = {
  origin: ['https://yugii.me', 'https://www.yugii.me', 'http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());

app.get('/', (req, res) => {
    console.log('Hello AI world!');
    res.send('Hello AI world!');
});

// Create the session
app.post('/sessions', chatController.startSession);

// Get the chat history for the session
app.get('/sessions/:sessionId/messages', async (req, res) => {
    const { sessionId } = req.params;
    try {
        // We use your EXISTING function!
        // passing 100 as limit so the user sees more history than the AI
        const history = await chatModel.getSessionHistory(sessionId, 100);
        res.json(history);
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Send a message
app.post('/chat', chatController.handleChat );

// get the tasks list
app.get('/tasks', chatController.getTasks);

// delete a specific task that wasn't supposed to be added
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        await deleteTask(userId, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// toggle a specific task on completion
app.patch('/tasks/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { userId, currentStatus } = req.body;

    try {
        await toggleTaskCompletion(userId, id, currentStatus);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
