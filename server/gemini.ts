import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ContentGenerationRequest {
  niche: string;
  generationType: 'date' | 'competitor' | 'trending';
  context?: string;
  competitors?: string[];
  holidays?: Array<{ name: string; date: string; description: string; }>;
  scrapedData?: any[];
}

export interface GeneratedContent {
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
}

export async function generateInstagramContentWithGemini(request: ContentGenerationRequest): Promise<GeneratedContent[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    let prompt = `You are an expert Instagram content creator specializing in ${request.niche}. `;

    switch (request.generationType) {
      case 'date':
        prompt += `Generate 3 viral Instagram posts for ${request.niche} based on upcoming holidays and trending dates. `;
        if (request.holidays && request.holidays.length > 0) {
          prompt += `Focus on these holidays: ${request.holidays.map(h => `${h.name} (${h.date}): ${h.description}`).join(', ')}. `;
        }
        break;

      case 'competitor':
        prompt += `Analyze these competitor posts and generate 3 similar but unique viral Instagram posts for ${request.niche}. `;
        if (request.scrapedData && request.scrapedData.length > 0) {
          prompt += `Competitor insights: ${JSON.stringify(request.scrapedData.slice(0, 5))}. `;
        }
        if (request.competitors && request.competitors.length > 0) {
          prompt += `Competitors to analyze: ${request.competitors.join(', ')}. `;
        }
        break;

      case 'trending':
        prompt += `Generate 3 viral Instagram posts for ${request.niche} based on current trending topics and viral formats. `;
        break;
    }

    prompt += `
For each post, provide:
1. A compelling headline (max 60 characters)
2. An engaging caption (100-200 words) with storytelling, value, and call-to-action
3. 20-30 relevant hashtags including trending, niche-specific, and community hashtags
4. 3 content ideas/variations for the post

Return the response as a JSON array with exactly this structure:
[
  {
    "headline": "Compelling headline here",
    "caption": "Engaging caption with value and CTA here...",
    "hashtags": "#trending #${request.niche} #viral #content #engagement",
    "ideas": "1. Idea variation one\n2. Idea variation two\n3. Idea variation three"
  }
]

Make sure each post is unique, engaging, and optimized for maximum reach and engagement.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              caption: { type: "string" },
              hashtags: { type: "string" },
              ideas: { type: "string" }
            },
            required: ["headline", "caption", "hashtags", "ideas"]
          }
        }
      },
      contents: prompt,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    const generatedContent = JSON.parse(responseText);
    
    if (!Array.isArray(generatedContent) || generatedContent.length === 0) {
      throw new Error('Invalid response format from Gemini');
    }

    return generatedContent;

  } catch (error) {
    console.error('Gemini content generation error:', error);
    throw new Error(`Failed to generate content with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function optimizeHashtagsWithGemini(niche: string, caption: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const prompt = `As an Instagram hashtag expert, analyze this caption and generate 25-30 optimized hashtags for the ${niche} niche.

Caption: "${caption}"

Rules:
- Mix of trending, niche-specific, and community hashtags
- Include variations of hashtag popularity (high, medium, low competition)
- No banned or shadowbanned hashtags
- Relevant to both the caption content and ${niche} niche
- Format as a single string with hashtags separated by spaces

Return only the hashtags string, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const hashtags = response.text?.trim();
    if (!hashtags) {
      throw new Error('Empty hashtag response from Gemini');
    }

    return hashtags;

  } catch (error) {
    console.error('Gemini hashtag optimization error:', error);
    throw new Error(`Failed to optimize hashtags with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeCompetitorContent(posts: any[], niche: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const prompt = `Analyze these competitor Instagram posts from the ${niche} niche and provide strategic insights:

Posts: ${JSON.stringify(posts.slice(0, 10))}

Provide analysis on:
1. Common content themes and patterns
2. Hashtag strategies being used
3. Engagement patterns and what drives high engagement
4. Content gaps and opportunities
5. Recommended content strategy based on analysis

Format the response as a detailed strategic report.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    const analysis = response.text;
    if (!analysis) {
      throw new Error('Empty analysis response from Gemini');
    }

    return analysis;

  } catch (error) {
    console.error('Gemini competitor analysis error:', error);
    throw new Error(`Failed to analyze competitor content with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}