
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_MESSAGES = [
  "The wind carries the scent of sulfur.",
  "Distant gunfire echoes off the mountains.",
  "A chill runs down your spine.",
  "The Geiger counter clicks ominously.",
  "You feel watched from the shadows.",
  "The sun beats down unforgivingly.",
  "A rusted supply drop plane flies overhead.",
  "Silence falls over the wasteland.",
  "You hear the crunch of dry leaves nearby.",
  "The air tastes of metal and ash.",
  "Supplies are scarce. Conserve your energy.",
  "Darkness approaches. Find shelter.",
  "The local wildlife seems agitated."
];

export const getSurvivalTips = async (gameState: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the narrator of a brutal survival game called RUSTED. 
      The player is at X:${Math.round(gameState.player.x)}, Y:${Math.round(gameState.player.y)}. 
      Health: ${gameState.player.health}%, Hunger: ${gameState.player.hunger}%. 
      Provide a brief (10-15 words) atmospheric world event or survival hint. 
      Examples: "The wind picks up, carrying the scent of radiation." or "The wolves are howling closer tonight."`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "The wasteland is silent.";
  } catch (error: any) {
    // Gracefully handle 429 (Quota Exceeded) or other errors by returning offline flavor text
    const isQuotaError = error?.status === 429 || 
                         (error?.message && error.message.includes('429')) ||
                         (error?.message && error.message.includes('quota'));
                         
    if (isQuotaError) {
      console.warn("Gemini API Quota Exceeded. Switching to offline narrative mode.");
    } else {
      console.warn("Gemini API Error (falling back to offline mode):", error);
    }

    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  }
};
