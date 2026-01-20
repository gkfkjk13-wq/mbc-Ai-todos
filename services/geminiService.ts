
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

export const analyzeTask = async (taskTitle: string): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this todo task and suggest a priority level, a list of sub-tasks to complete it, and a brief reasoning: "${taskTitle}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedPriority: {
            type: Type.STRING,
            description: "Suggested priority: low, medium, or high",
          },
          subTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of 3-5 sub-tasks to achieve the main goal",
          },
          reasoning: {
            type: Type.STRING,
            description: "A short sentence explaining the priority",
          }
        },
        required: ["suggestedPriority", "subTasks", "reasoning"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      suggestedPriority: (['low', 'medium', 'high'].includes(result.suggestedPriority) ? result.suggestedPriority : 'medium') as any,
      subTasks: result.subTasks || [],
      reasoning: result.reasoning || ""
    };
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return {
      suggestedPriority: 'medium',
      subTasks: [],
      reasoning: "Analysis failed."
    };
  }
};
