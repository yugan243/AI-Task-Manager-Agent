const express = require('express');
const app = express();
const path = require('path');
const chatController = require('./controllers/chatController');

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    console.log('Hello AI world!');
    res.send('Hello AI world!');
});

// Create the session
app.post('/sessions', chatController.startSession);

// Send a message
app.post('/chat', chatController.handleChat );

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`);
    });
}

module.exports = app;
