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
  numberOfIdeas?: number;
}

export interface GeneratedContent {
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
}

export interface SinglePostRequest {
  niche: string;
  generationType: 'date' | 'competitor' | 'trending';
  context?: string;
  post: any;
  holidays?: Array<{ name: string; date: string; description: string; }>;
  numberOfIdeas?: number;
}

export async function generateInstagramContentWithGemini(request: ContentGenerationRequest): Promise<GeneratedContent[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    // Use provided scraped data or fetch fresh data if needed
    let apifyData: ApifyTrendingPost[] = [];
    
    if (request.scrapedData && request.scrapedData.length > 0) {
      // Use provided scraped data (from streaming API)
      apifyData = request.scrapedData;
      console.log(`Using provided scraped data: ${apifyData.length} posts`);
    } else if (apifyScraper && !request.useApifyData) {
      // Fresh data fetch when no scraped data provided
      try {
        console.log('Fetching real Instagram data from Apify...');
        if (request.generationType === 'trending') {
          apifyData = await apifyScraper.searchTrendingPosts(request.niche, 10);
        } else if (request.generationType === 'competitor' && request.competitors) {
          // Use direct URLs for competitor analysis
          const instagramUrls = apifyScraper.convertUsernamesToUrls(request.competitors);
          apifyData = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 3);
        }
        console.log(`Fetched ${apifyData.length} posts from Apify`);
      } catch (error) {
        console.error('Failed to fetch Apify data:', error);
        // Continue with fallback generation instead of throwing error
        apifyData = [];
      }
    }

    let prompt = `You are an expert Instagram content creator specializing in ${request.niche}. `;

    switch (request.generationType) {
      case 'date':
        const numberOfDateIdeas = request.numberOfIdeas || 3;
        prompt += `Generate ${numberOfDateIdeas} viral Instagram posts for ${request.niche} based on upcoming holidays and trending dates. `;
        if (request.holidays && request.holidays.length > 0) {
          prompt += `Focus on these holidays: ${request.holidays.map(h => `${h.name} (${h.date}): ${h.description}`).join(', ')}. `;
        }
        break;

      case 'competitor':
        const numCompetitorPosts = apifyData.length;
        prompt += `Analyze competitor posts and generate ${numCompetitorPosts} unique viral Instagram posts for ${request.niche}. `;
        
        // Use Apify data
        if (apifyData && apifyData.length > 0) {
          prompt += `\n\nREAL COMPETITOR ANALYSIS DATA (from Apify):\n`;
          const sortedPosts = apifyData.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
          
          for (const post of sortedPosts) {
            prompt += `\nCompetitor: @${post.ownerUsername || 'unknown'} (${post.ownerFullName || 'Unknown'})\n`;
            prompt += `  Caption: "${(post.caption || '').substring(0, 200)}${(post.caption || '').length > 200 ? '...' : ''}"\n`;
            prompt += `  Performance: ${post.likesCount || 0} likes, ${post.commentsCount || 0} comments\n`;
            prompt += `  Hashtags: ${(post.hashtags || []).slice(0, 10).join(' ')}\n`;
            prompt += `  Post URL: ${post.url || 'N/A'}\n`;
            prompt += `  Post Type: ${post.type || 'Image'}\n`;
            prompt += `  Location: ${post.locationName || 'Not specified'}\n`;
            
            // Add image analysis only for Image type posts
            if (post.displayUrl && post.type === 'Image') {
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
        } else {
          // Fallback for no competitor data
          prompt += `Generate 3 viral Instagram posts for ${request.niche} using general competitor analysis strategies. `;
          prompt += `Focus on creating engaging content that would outperform typical competitors in the ${request.niche} space. `;
        }
        
        if (request.competitors && request.competitors.length > 0) {
          prompt += `Target competitors: ${request.competitors.join(', ')}. `;
        }
        break;

      case 'trending':
        const numTrendingPosts = apifyData.length;
        prompt += `Generate ${numTrendingPosts} viral Instagram posts for ${request.niche} based on current trending topics and viral formats. `;
        
        // Use Apify data
        if (apifyData && apifyData.length > 0) {
          prompt += `\n\nREAL TRENDING INSTAGRAM DATA (from Apify):\n`;
          
          for (const post of apifyData) {
            prompt += `\nPost by @${post.ownerUsername || 'unknown'} (${post.ownerFullName || 'Unknown'}):\n`;
            prompt += `  Caption: "${(post.caption || '').substring(0, 200)}${(post.caption || '').length > 200 ? '...' : ''}"\n`;
            prompt += `  Performance: ${post.likesCount || 0} likes, ${post.commentsCount || 0} comments\n`;
            prompt += `  Hashtags: ${(post.hashtags || []).slice(0, 10).join(' ')}\n`;
            prompt += `  Post URL: ${post.url || 'N/A'}\n`;
            prompt += `  Post Type: ${post.type || 'Image'}\n`;
            prompt += `  Location: ${post.locationName || 'Not specified'}\n`;
            
            // Add image analysis only for Image type posts
            if (post.displayUrl && post.type === 'Image') {
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
        } else {
          // Fallback for no trending data
          prompt += `Generate 3 viral Instagram posts for ${request.niche} using current trending topics and formats. `;
          prompt += `Focus on popular content strategies that work well in the ${request.niche} space. `;
        }
        break;
    }

    prompt += `

IMPORTANT FORMATTING REQUIREMENTS:
- Headlines: Maximum 10 words, catchy and attention-grabbing
- Captions: Exactly 20-40 words, engaging and action-oriented
- Hashtags: Exactly 5-10 relevant hashtags. 80-85% should be from the original posts' hashtags, 15-20% can be similar/related ones
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

    let generatedContent = JSON.parse(responseText);
    
    if (!Array.isArray(generatedContent) || generatedContent.length === 0) {
      throw new Error('Invalid response format from Gemini');
    }
    
    // Verify exact number of ideas generated
    const expectedCount = request.numberOfIdeas || (apifyData.length > 0 ? apifyData.length : 3);
    if (generatedContent.length !== expectedCount) {
      console.warn(`Expected ${expectedCount} ideas, got ${generatedContent.length}. Adjusting...`);
      
      if (generatedContent.length > expectedCount) {
        // Truncate to exact count
        generatedContent = generatedContent.slice(0, expectedCount);
      } else {
        // Pad with copies of existing ideas if needed
        while (generatedContent.length < expectedCount) {
          const randomExisting = generatedContent[Math.floor(Math.random() * generatedContent.length)];
          generatedContent.push({
            ...randomExisting,
            headline: randomExisting.headline + " (Variant)",
            caption: randomExisting.caption.replace(/\b\w/, (l) => l.toUpperCase()) // Slight variation
          });
        }
      }
    }

    // Timer fallback for strategy generation - if ideas field is short, enhance it
    const enhancedContent = await Promise.all(
      generatedContent.map(async (content, index) => {
        try {
          // If ideas field is less than 30 words, enhance it using hashtags and caption
          const wordsCount = content.ideas.split(' ').length;
          if (wordsCount < 30) {
            console.log(`Enhancing strategy for content ${index + 1} (${wordsCount} words)`);
            const enhancedStrategy = await generateStrategyFromContent(content.caption, content.hashtags, request.niche);
            return {
              ...content,
              ideas: enhancedStrategy
            };
          }
          return content;
        } catch (error) {
          console.error(`Failed to enhance strategy for content ${index + 1}:`, error);
          return content; // Return original if enhancement fails
        }
      })
    );

    return enhancedContent;

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

// Helper function to generate enhanced strategy from content
async function generateStrategyFromContent(caption: string, hashtags: string, niche: string): Promise<string> {
  try {
    const prompt = `Based on this Instagram content for ${niche}, create a detailed 40-50 word strategy explaining what to do, how to execute, and why this approach works:

Caption: "${caption}"
Hashtags: "${hashtags}"

Generate a comprehensive strategy that includes:
1. What specific action to take
2. How to execute it effectively  
3. Why this strategy works for engagement
4. Best timing or format recommendations

Keep it exactly 40-50 words and actionable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const strategy = response.text?.trim();
    if (!strategy) {
      throw new Error('Empty strategy response from Gemini');
    }

    return strategy;
  } catch (error) {
    console.error('Strategy generation error:', error);
    // Fallback strategy based on content
    return `Post this ${niche} content during peak hours (6-9 PM). Use engaging visuals and include call-to-action. Hashtags target both broad and niche audiences. Respond to comments within first hour to boost engagement algorithm ranking.`;
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

export async function generateSinglePostContent(request: SinglePostRequest): Promise<GeneratedContent> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const post = request.post;
  
  let prompt = `You are an expert Instagram content creator specializing in ${request.niche}. 

  ${request.post ? `Analyze this single Instagram post and create 1 unique viral content idea based on it:` : `Create ${request.numberOfIdeas || 1} unique viral content ideas for ${request.niche}:`}

${post ? `ORIGINAL POST DATA:
- Creator: @${post.ownerUsername} (${post.ownerFullName})
- Caption: "${post.caption}"
- Hashtags: ${post.hashtags ? post.hashtags.join(' ') : 'none'}
- Performance: ${post.likesCount} likes, ${post.commentsCount} comments
- Post URL: ${post.url}` : ''}

`;

  if (request.generationType === 'date' && request.holidays) {
    prompt += `\nUse these upcoming holidays for inspiration: ${request.holidays.map(h => `${h.name} (${h.date})`).join(', ')}\n`;
  }

  // Add image analysis if available
  if (post && post.displayUrl && post.type === 'Image') {
    try {
      const imageAnalysis = await analyzeImageFromUrl(post.displayUrl);
      prompt += `\nIMAGE ANALYSIS: ${imageAnalysis}\n`;
    } catch (error) {
      console.warn('Failed to analyze image:', error);
    }
  }

  const numberOfIdeas = request.numberOfIdeas || 1;
  prompt += `
Create ${numberOfIdeas} Instagram post${numberOfIdeas > 1 ? 's' : ''} that:
${post ? `1. Is inspired by the original post but completely unique for ${request.niche}
2. Uses similar engagement tactics but with your own twist
3. Incorporates trending elements from the original
4. Has maximum viral potential` : `1. Is completely unique for ${request.niche}
2. Uses viral engagement tactics and trending elements
3. Has maximum viral potential and audience appeal`}

Return ONLY a valid JSON ${numberOfIdeas > 1 ? 'array' : 'object'} with exactly this structure:
${numberOfIdeas > 1 ? '[' : ''}
{
  "headline": "Catchy headline (max 10 words)",
  "caption": "Instagram caption (exactly 20-40 words, engaging and actionable)",
  "hashtags": "5-10 relevant hashtags separated by spaces",
  "ideas": "Detailed execution strategy (40-50 words explaining why this will work and how to execute it)${post ? `. Source: ${post.url}` : ''}"
}${numberOfIdeas > 1 ? ', {...}]' : ''}

Important: 
- Caption must be exactly 20-40 words
- Generate exactly ${numberOfIdeas} idea${numberOfIdeas > 1 ? 's' : ''}
${post ? `- Ideas must include strategy + original post URL with 'Source:' prefix at the end` : ''}
- Make it specific to ${request.niche}
- Focus on viral potential`;

  try {
    console.log(`🤖 Gemini: Generating ${numberOfIdeas} idea${numberOfIdeas > 1 ? 's' : ''} ${post ? `for post from @${post.ownerUsername}` : 'for date-specific content'}`);
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const responseText = result.text?.trim() || '';
    
    console.log(`📝 Gemini response received (${responseText.length} characters)`);
    
    // Extract JSON from response (handle both array and object)
    const jsonMatch = numberOfIdeas > 1 ? 
      responseText.match(/\[[\s\S]*\]/) : 
      responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ No valid JSON found in Gemini response:', responseText);
      throw new Error('No valid JSON found in response');
    }
    
    const generatedContent = JSON.parse(jsonMatch[0]);
    
    if (numberOfIdeas > 1) {
      // Validate array response
      if (!Array.isArray(generatedContent) || generatedContent.length === 0) {
        throw new Error('Invalid array response format from Gemini');
      }
      
      // Verify exact count
      if (generatedContent.length !== numberOfIdeas) {
        console.warn(`Expected ${numberOfIdeas} ideas, got ${generatedContent.length}. Adjusting...`);
        
        if (generatedContent.length > numberOfIdeas) {
          generatedContent.splice(numberOfIdeas);
        } else {
          // Pad with variations
          while (generatedContent.length < numberOfIdeas) {
            const randomExisting = generatedContent[Math.floor(Math.random() * generatedContent.length)];
            generatedContent.push({
              ...randomExisting,
              headline: randomExisting.headline + " (Variant)",
              caption: randomExisting.caption.replace(/\b\w/, (l) => l.toUpperCase())
            });
          }
        }
      }
      
      console.log(`✅ Gemini: Successfully generated ${generatedContent.length} ideas`);
      return generatedContent;
    } else {
      // Validate single object response
      if (!generatedContent.headline || !generatedContent.caption || !generatedContent.hashtags || !generatedContent.ideas) {
        console.error('❌ Generated content missing required fields:', generatedContent);
        throw new Error('Generated content missing required fields');
      }
      
      console.log(`✅ Gemini: Successfully generated content - ${generatedContent.headline}`);
      return generatedContent;
    }
  } catch (error) {
    console.error('❌ Error generating content:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export async function refineContentWithGemini(idea: any, message: string, chatHistory: any[]): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const contextPrompt = buildInstagramExpertPrompt(idea, chatHistory, message);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contextPrompt,
    });

    return response.text || "I'm having trouble processing your request. Please try again with a different question.";
  } catch (error) {
    console.error('Error refining content with Gemini:', error);
    throw new Error('Failed to refine content. Please try again.');
  }
}

// Enhanced streaming version for real-time responses
export async function* refineContentStreamWithGemini(idea: any, message: string, chatHistory: any[]): AsyncGenerator<string, void, unknown> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  try {
    const contextPrompt = buildInstagramExpertPrompt(idea, chatHistory, message);

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-pro", 
      contents: contextPrompt,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming content refinement with Gemini:', error);
    yield "I'm experiencing technical difficulties. Please try your request again.";
  }
}

// Build expert Instagram content prompt
function buildInstagramExpertPrompt(idea: any, chatHistory: any[], message: string): string {
  return `You are an Instagram growth expert and viral content specialist with deep knowledge of:
- Psychology of viral content and engagement hooks
- Latest Instagram algorithm trends and best practices  
- Content formats that drive maximum reach and engagement
- Hashtag strategies for different niches and audience sizes
- Storytelling techniques that convert views to followers
- Visual content optimization and trending aesthetics
- Community building and audience retention strategies

CURRENT CONTENT CONTEXT:
Original Idea:
• Headline: ${idea.headline}
• Caption: ${idea.caption} 
• Hashtags: ${idea.hashtags}
• Strategy: ${idea.ideas}
• Type: ${idea.generationType}
• Niche: ${idea.niche || 'General'}

CONVERSATION HISTORY:
${chatHistory.length > 0 ? chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n') : 'This is the start of our conversation.'}

CURRENT REQUEST: ${message}

INSTRUCTIONS:
Provide expert, actionable advice that:
✓ Uses proven Instagram growth strategies
✓ Incorporates current trends and algorithm insights
✓ Gives specific, implementable suggestions
✓ Explains WHY each recommendation works
✓ Considers the user's niche and audience
✓ Suggests creative angles and hooks
✓ Optimizes for maximum viral potential

Be conversational, encouraging, and highly knowledgeable. Give 2-3 specific, actionable recommendations with reasoning.`;
}