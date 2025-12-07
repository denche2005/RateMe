
import { GoogleGenAI, Type } from "@google/genai";
import { User, BadgeType } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// Helper to check if API key is present (for UI feedback)
export const isGeminiEnabled = (): boolean => !!import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Generates a "Vibe Check" description of a user based on their stats.
 */
export const generateAIVibeCheck = async (user: User): Promise<string> => {
  if (!isGeminiEnabled()) return "AI Vibe Check unavailable (Missing API Key).";

  try {
    const prompt = `
      Analyze this social profile and give a short, witty, Gen-Z style "Vibe Check" (max 2 sentences).
      Be honest but fun. Use emojis.
      
      User: ${user.displayName} (@${user.username})
      Main Score: ${user.averageScore.toFixed(1)}/10
      Coins: ${user.coins}
      
      Stats:
      ${Object.entries(user.badgeAverages).map(([k, v]) => `${k}: ${v}`).join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "Could not generate vibe check.";
  } catch (error) {
    console.error("Gemini Vibe Check Error:", error);
    return "AI is taking a nap. Try again later.";
  }
};

/**
 * Checks content for safety using Gemini.
 */
export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  if (!isGeminiEnabled()) return { safe: true }; // Fail open if no API key for demo purposes

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Evaluate the following text for social media. Is it hate speech, explicit, or highly toxic? 
      Respond with JSON: { "safe": boolean, "reason": string }.
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Moderation Error:", error);
    return { safe: true };
  }
};
