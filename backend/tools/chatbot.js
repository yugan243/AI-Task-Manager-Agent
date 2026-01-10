const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const dotenv = require('dotenv').config();

const Chatmodel = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
});


const generateAIResponse = async(userMessage) => {
    try {
        const response = await Chatmodel.invoke(userMessage);
        return response.content;
    } catch ( err ) {
        console.error("AI tool error");
        throw err;
    }
    
}


module.exports = { generateAIResponse };