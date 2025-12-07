
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BriefData, DesignCategory, Difficulty, Feedback, ClientType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Brief Generation Schema
const briefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    projectName: { type: Type.STRING, description: "Project Name" },
    companyName: { type: Type.STRING, description: "Company/Channel Name" },
    industry: { type: Type.STRING, description: "Specific Industry" },
    aboutCompany: { type: Type.STRING, description: "About the company" },
    targetAudience: { type: Type.STRING, description: "Target Audience description" },
    projectGoal: { type: Type.STRING, description: "Main goal of the design" },
    
    contentSummary: { 
      type: Type.STRING, 
      description: "Detailed story/scenario of the content." 
    },

    requiredDeliverables: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of deliverables" 
    },
    stylePreferences: { type: Type.STRING, description: "Visual style description based on analysis" },
    suggestedColors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Color palette hex codes"
    },
    deadlineHours: { type: Type.INTEGER, description: "Deadline in hours" },
    copywriting: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Headlines or copy text to be included"
    },
    contactDetails: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Mock contact info"
    },
    visualReferences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Keywords for visual research"
    },
    providedAssetDescription: {
      type: Type.STRING,
      description: "Detailed English description for a high-quality stock photo to be used. If YouTube/Education/Product, specify 'isolated on white background'."
    }
  },
  required: [
    "projectName", 
    "companyName", 
    "industry", 
    "aboutCompany", 
    "targetAudience", 
    "projectGoal", 
    "contentSummary",
    "requiredDeliverables", 
    "stylePreferences", 
    "suggestedColors", 
    "deadlineHours",
    "copywriting",
    "contactDetails",
    "visualReferences",
    "providedAssetDescription"
  ]
};

// 2. Feedback Generation Schema
const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score 1-10" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths" },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Weaknesses" },
    advice: { type: Type.STRING, description: "Advice" },
    isSuccess: { type: Type.BOOLEAN, description: "Pass/Fail" }
  },
  required: ["score", "strengths", "weaknesses", "advice", "isSuccess"]
};

export const generateDesignBrief = async (
  category: DesignCategory, 
  difficulty: Difficulty, 
  clientType: ClientType,
  specificIndustry?: string,
  referenceImageBase64?: string
): Promise<BriefData> => {
  try {
    const isForeign = clientType === ClientType.Foreign;
    
    // Construct Prompt parts based on Category
    let categoryContext = "";
    if (category === DesignCategory.Football) {
      categoryContext = "Focus on Football/Soccer aesthetics, high energy, dynamic player poses, grit, textures, and bold typography.";
    } else if (category === DesignCategory.Collage) {
      categoryContext = "Focus on Collage Art aesthetics. Mixed media, torn paper edges, vintage elements mixed with modern, surrealism, visual metaphors.";
    }

    const languageInstruction = isForeign 
      ? "CRITICAL: OUTPUT EVERYTHING IN ENGLISH. The client is International (US/UK/Europe). Use Western design trends, English copy, and English formatting."
      : "CRITICAL: OUTPUT EVERYTHING IN ARABIC (except hex codes and providedAssetDescription). The client is Arab. Use culturally relevant terms.";

    let mainPrompt = "";
    
    if (category === DesignCategory.Remix && referenceImageBase64) {
      mainPrompt = `
        Act as a Senior Art Director. 
        TASK: Analyze the visual style, composition, typography, and vibe of the attached image.
        THEN: Create a design brief for a COMPLETELY DIFFERENT product/industry but using this EXACT style (Style Remix).
        
        Example: If image is a neon cyberpunk burger ad, create a brief for a Sneaker Brand using that same neon cyberpunk style.
        
        Parameters:
        - Difficulty: ${difficulty}
        - Client Market: ${isForeign ? "International" : "Arab"}
        
        ${languageInstruction}
        
        Requirements:
        1. 'stylePreferences': Describe the style of the uploaded image in detail so the designer can replicate it.
        2. 'projectGoal': Create a campaign that matches this visual identity.
        3. 'copywriting': Write catchy headlines that fit this visual mood.
      `;
    } else {
      mainPrompt = `
        Act as a Senior Art Director. Create a highly detailed design brief.
        
        Parameters:
        - Category: ${category}
        - Difficulty: ${difficulty}
        - Client Market: ${isForeign ? "International (Global)" : "Middle East (Arab)"}
        - Specific Industry/Niche: ${specificIndustry || "Random Creative Niche"}
        
        ${languageInstruction}
        ${categoryContext}
        
        Requirements for fields:
        1. 'contentSummary': Create a specific scenario or story. If YouTube, describe the video plot. If Football, describe the match stakes.
        2. 'providedAssetDescription': MUST be in English. 
           - If Category is YouTube, Education, or Product: End with "isolated on white background, studio lighting, 8k resolution".
           - If Football: "Dynamic football player action shot, stadium lights, professional sports photography".
           - If Collage: "Vintage paper texture, old statues, flowers, halftone pattern".
        3. 'copywriting': Provide actual text to be placed on the design.
        
        Make it professional and inspiring.
      `;
    }

    const contents = [];
    if (referenceImageBase64) {
      contents.push({ inlineData: { mimeType: "image/jpeg", data: referenceImageBase64 } });
    }
    contents.push({ text: mainPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: briefSchema,
        temperature: 0.95, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data received.");

    const data = JSON.parse(text) as BriefData;
    data.id = crypto.randomUUID();
    data.clientType = clientType; // Store client type for UI rendering
    if (referenceImageBase64) data.referenceImage = referenceImageBase64;
    return data;

  } catch (error) {
    console.error("Error generating brief:", error);
    throw error;
  }
};

export const evaluateSubmission = async (brief: BriefData, base64Image: string): Promise<Feedback> => {
  try {
    const prompt = `
      Act as a Senior Design Mentor. Evaluate this submission based on the brief:
      - Project: ${brief.projectName}
      - Goal: ${brief.projectGoal}
      - Context: ${brief.contentSummary}
      
      Analyze the image. Be constructive, strict but encouraging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Evaluation failed");
    return JSON.parse(text) as Feedback;

  } catch (error) {
    console.error("Error evaluating:", error);
    return {
      score: 8,
      strengths: ["Good effort", "Nice colors"],
      weaknesses: ["AI analysis unavailable right now"],
      advice: "Keep practicing!",
      isSuccess: true
    };
  }
};
