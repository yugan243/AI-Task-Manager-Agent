const dotenv = require('dotenv').config();

// 1. Load Keys
const rawKeys = process.env.GOOGLE_API_KEY_POOL || "";
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);

if (apiKeys.length === 0) throw new Error("No API Keys found in .env");

// 2. Define Strategy: Lite first (High RPM), then Flash (Standard)
const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

// 3. GLOBAL STATE (Persists while server is running)
let keyIndex = 0;
let modelIndex = 0;

// 4. The Manager Object
const KeyManager = {
    // Returns the currently active configuration
    getCurrentConfig: () => {
        return {
            apiKey: apiKeys[keyIndex],
            modelName: models[modelIndex],
            // Debug info to see what's happening
            debugId: `Key-${keyIndex + 1} (${models[modelIndex]})` 
        };
    },

    // Rotates to the next best option
    rotate: () => {
        const previous = `Key-${keyIndex + 1} (${models[modelIndex]})`;
        
        // Strategy: Rotate Key first. If all keys exhausted, switch Model.
        keyIndex++;

        // If we ran out of keys for this model...
        if (keyIndex >= apiKeys.length) {
            console.log(`All keys exhausted for ${models[modelIndex]}. Switching Model Tier...`);
            keyIndex = 0; // Reset key index
            modelIndex++; // Move to next model
        }

        // If we ran out of Models too (Complete Exhaustion)...
        if (modelIndex >= models.length) {
            console.error("CRITICAL: All Keys and Models exhausted. Resetting to start.");
            keyIndex = 0;
            modelIndex = 0;
            // Note: In production, you might want to pause here, but resetting allows retries.
        }

        console.log(`Rotated Config: [${previous}] ➔ [Key-${keyIndex + 1} (${models[modelIndex]})]`);
    },

    // Helper to calculate max total attempts possible
    getMaxAttempts: () => apiKeys.length * models.length
};

module.exports = KeyManager;