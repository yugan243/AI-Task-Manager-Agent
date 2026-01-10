const { generateAIResponse } = require('../tools/chatbot');

const handleChat = async (req, res) => {
    const userMessage = req.body.message;

    try {
        const aiRespose = await generateAIResponse(userMessage);
        res.status(200).json({ 'AI Respose': aiRespose });
        console.log('AI response sent');
    } catch (err) {
        return res.status(500).json({ 'error': err.message });
    }
}

module.exports = { handleChat };