import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { apifyScraper, type ApifyTrendingPost } from "./apify-scraper.js";

// Initialize Gemini AI with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ContentGenerationRequest {
  niche: string;
  generationType: 'date' | 'competitor' | 'trending';
  context?: string;
  competitors?: string[];
  holidays?: Array<{ name: string; date: string; description: string; }>;
  scrapedData?: any[];
  useApifyData?: boolean;
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
    // Use Apify data if available and requested
    let apifyData: ApifyTrendingPost[] = [];
    if (request.useApifyData && apifyScraper) {
      try {
        console.log('Fetching real Instagram data from Apify...');
        if (request.generationType === 'trending') {
          apifyData = await apifyScraper.searchTrendingPosts(request.niche, 10);
        } else if (request.generationType === 'competitor' && request.competitors) {
          // Search multiple competitors
          const hashtags = request.competitors.map(comp => comp.replace('@', ''));
          apifyData = await apifyScraper.searchMultipleHashtags(hashtags, 8);
        }
        console.log(`Fetched ${apifyData.length} posts from Apify`);
      } catch (error) {
        console.error('Failed to fetch Apify data:', error);
      }
    }

    let prompt = `You are an expert Instagram content creator specializing in ${request.niche}. `;

    switch (request.generationType) {
      case 'date':
        prompt += `Generate 3 viral Instagram posts for ${request.niche} based on upcoming holidays and trending dates. `;
        if (request.holidays && request.holidays.length > 0) {
          prompt += `Focus on these holidays: ${request.holidays.map(h => `${h.name} (${h.date}): ${h.description}`).join(', ')}. `;
        }
        break;

      case 'competitor':
        prompt += `Analyze competitor posts and generate 3 unique viral Instagram posts for ${request.niche}. `;
        
        // Use Apify data if available
        if (apifyData && apifyData.length > 0) {
          prompt += `\n\nREAL COMPETITOR ANALYSIS DATA (from Apify):\n`;
          const sortedPosts = apifyData.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
          
          for (const post of sortedPosts.slice(0, 6)) {
            prompt += `\nCompetitor: @${post.ownerUsername} (${post.ownerFullName})\n`;
            prompt += `  Caption: "${post.caption.substring(0, 200)}${post.caption.length > 200 ? '...' : ''}"\n`;
            prompt += `  Performance: ${post.likesCount} likes, ${post.commentsCount} comments\n`;
            prompt += `  Hashtags: ${post.hashtags.slice(0, 10).join(' ')}\n`;
            prompt += `  Post URL: ${post.url}\n`;
            prompt += `  Location: ${post.locationName || 'Not specified'}\n`;
            
            // Add image analysis if available
            if (post.displayUrl) {
              try {
                const imageAnalysis = await analyzeImageFromUrl(post.displayUrl);
                prompt += `  Image Analysis: ${imageAnalysis}\n`;
              } catch (error) {
                console.error('Failed to analyze image:', error);
              }
            }
          }
          prompt += `\nCreate content that outperforms these competitors by identifying gaps and improving on their successful patterns. `;
          prompt += `For each generated idea, include the specific Instagram post URL that inspired it using the format: "Inspired by: [post URL]" in the ideas field. `;
        } else if (request.scrapedData && request.scrapedData.length > 0) {
          // Fallback to existing scraped data
          prompt += `\n\nREAL COMPETITOR ANALYSIS DATA:\n`;
          request.scrapedData.forEach((profile: any, index: number) => {
            prompt += `\nCompetitor ${index + 1}: @${profile.username} (${profile.followers.toLocaleString()} followers)\n`;
            prompt += `Recent posts analysis:\n`;
            profile.posts.slice(0, 5).forEach((post: any, postIndex: number) => {
              prompt += `  Post ${postIndex + 1}: "${post.caption.substring(0, 150)}${post.caption.length > 150 ? '...' : ''}"\n`;
              prompt += `    Engagement: ${post.likes} likes, ${post.comments} comments\n`;
              prompt += `    Hashtags: ${post.hashtags.slice(0, 10).join(' ')}\n`;
              prompt += `    Post URL: ${post.postUrl}\n`;
            });
          });
          prompt += `\nCreate content that outperforms these competitors by identifying gaps and improving on their successful patterns. `;
          prompt += `For each generated idea, include the specific Instagram post URL that inspired it using the format: "Inspired by: [post URL]" in the ideas field. `;
        } else {
          prompt += `Note: Competitor data could not be scraped. Generate content based on general ${request.niche} best practices. `;
        }
        if (request.competitors && request.competitors.length > 0) {
          prompt += `Target competitors: ${request.competitors.join(', ')}. `;
        }
        break;

      case 'trending':
        prompt += `Generate 3 viral Instagram posts for ${request.niche} based on current trending topics and viral formats. `;
        
        // Use Apify data if available
        if (apifyData && apifyData.length > 0) {
          prompt += `\n\nREAL TRENDING INSTAGRAM DATA (from Apify):\n`;
          const topPosts = apifyData.slice(0, 8);
          
          for (const post of topPosts) {
            prompt += `\nPost by @${post.ownerUsername} (${post.ownerFullName}):\n`;
            prompt += `  Caption: "${post.caption.substring(0, 200)}${post.caption.length > 200 ? '...' : ''}"\n`;
            prompt += `  Performance: ${post.likesCount} likes, ${post.commentsCount} comments\n`;
            prompt += `  Hashtags: ${post.hashtags.slice(0, 10).join(' ')}\n`;
            prompt += `  Post URL: ${post.url}\n`;
            prompt += `  Location: ${post.locationName || 'Not specified'}\n`;
            
            // Add image analysis if available
            if (post.displayUrl) {
              try {
                const imageAnalysis = await analyzeImageFromUrl(post.displayUrl);
                prompt += `  Image Analysis: ${imageAnalysis}\n`;
              } catch (error) {
                console.error('Failed to analyze image:', error);
              }
            }
          }
          prompt += `\nUse these real trending patterns to create viral content that follows successful formats. `;
          prompt += `For each generated idea, include the specific Instagram post URL that inspired it using the format: "Inspired by: [post URL]" in the ideas field. `;
        } else if (request.scrapedData && request.scrapedData.length > 0) {
          // Fallback to existing scraped data
          prompt += `\n\nTRENDING ANALYSIS FROM COMPETITORS:\n`;
          const allPosts = request.scrapedData.flatMap((profile: any) => 
            profile.posts.map((post: any) => ({
              ...post,
              username: profile.username,
              engagementRate: (post.likes + post.comments) / Math.max(profile.followers, 1) * 100
            }))
          );
          
          // Sort by engagement rate and take top 5
          const topPosts = allPosts
            .sort((a, b) => b.engagementRate - a.engagementRate)
            .slice(0, 5);
            
          prompt += `Top performing posts for trend analysis:\n`;
          topPosts.forEach((post: any, index: number) => {
            prompt += `  ${index + 1}. @${post.username}: "${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}"\n`;
            prompt += `     Performance: ${post.likes} likes, ${post.comments} comments (${post.engagementRate.toFixed(2)}% engagement)\n`;
            prompt += `     Key hashtags: ${post.hashtags.slice(0, 8).join(' ')}\n`;
            prompt += `     Post URL: ${post.postUrl}\n`;
          });
          prompt += `\nUse these trending patterns to create viral content that follows successful formats. `;
          prompt += `For each generated idea, include the specific Instagram post URL that inspired it using the format: "Inspired by: [post URL]" in the ideas field. `;
        }
        break;
    }

    prompt += `

IMPORTANT FORMATTING REQUIREMENTS:
- Headlines: Maximum 10 words, catchy and attention-grabbing
- Captions: Exactly 20-40 words, engaging and action-oriented
- Hashtags: Exactly 5-10 relevant hashtags, no more, no less
- Ideas: Exactly 40-50 words explaining what to do, how to execute, and why this strategy works

Return the response as a JSON array with exactly this structure:
[
  {
    "headline": "Short catchy headline (max 10 words)",
    "caption": "Engaging 20-40 word caption with clear value proposition",
    "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5",
    "ideas": "Detailed content strategy: what to do, how to execute, and why it works (40-50 words). If inspired by a specific post, include: Inspired by: [post URL]"
  }
]

Make each post unique, viral-worthy, and perfectly formatted according to the requirements.`;

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
    const prompt = `As an Instagram hashtag expert, analyze this caption and generate exactly 8-10 optimized hashtags for the ${niche} niche.

Caption: "${caption}"

Rules:
- Generate exactly 8-10 hashtags total
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

// Image analysis function using Gemini's multimodal capabilities
export async function analyzeImageFromUrl(imageUrl: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    // Download image as base64
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    
    const base64Image = Buffer.from(response.data).toString('base64');
    
    const contents = [
      {
        inlineData: {
          data: base64Image,
          mimeType: response.headers['content-type'] || 'image/jpeg',
        },
      },
      `Analyze this Instagram image and describe:
1. Visual elements (colors, composition, subjects)
2. Style and aesthetic (modern, minimalist, vibrant, etc.)
3. Content type (product, lifestyle, behind-scenes, etc.)
4. Emotional tone and mood
5. What makes it engaging for social media
Keep analysis concise but specific.`,
    ];

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
    });

    return aiResponse.text || "Unable to analyze image";
  } catch (error) {
    console.error('Image analysis error:', error);
    return "Image analysis unavailable";
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