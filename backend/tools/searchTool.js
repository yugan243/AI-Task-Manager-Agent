const fetch = require('node-fetch'); 
require('dotenv').config();

const searchInternet = async (query) => {
    console.log("Searching for:", query);
    try {
        const response = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": process.env.SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ q: query })
        });

        const data = await response.json();

        // Check for specific API errors
        if (!response.ok) {
            console.error("API Error:", data); // Debug Log 2
            return `Error searching internet: ${data.message || 'Unknown error'}`;
        }

        // If no results
        if (!data.organic) return "No search results found.";

        // Format the top 3 results nicely for the AI
        const snippets = data.organic.slice(0, 3).map((result, index) => {
            return `Result ${index + 1}:
            Title: ${result.title}
            Snippet: ${result.snippet}
            ---`;
        }).join("\n");

        console.log("Search Successful"); // Debug Log 3
        return `Here are the search results for "${query}":\n${snippets}`;

    } catch (error) {
        console.error("Search Error:", error);
        return "I couldn't access the internet right now.";
    }
};

module.exports = { searchInternet };