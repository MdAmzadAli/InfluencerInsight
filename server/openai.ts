import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
}) : null;

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

// Mock data generator for testing without API key
function generateMockContent(request: ContentGenerationRequest): GeneratedContent[] {
  const niche = request.niche || "lifestyle";
  const baseContent = {
    date: [
      {
        headline: "🎉 Celebrate the Festival Season with Style!",
        caption: "The festive season is here! 🪔✨ As we embrace the joy of traditional celebrations, here's how to make your festivities memorable:\n\n• Capture authentic moments with loved ones\n• Share your cultural traditions\n• Spread positivity and joy\n\nWhat's your favorite festival memory? Share it in the comments below! 👇\n\n#FestivalVibes #CelebrationTime #TraditionMeetsModern",
        hashtags: "#festival #celebration #traditional #culture #joy #family #memories #festive #india #lifestyle #authentic #blessed #gratitude #community #togetherness #happiness #culture #heritage #moments #love #peace #prosperity #goodvibes #positiveenergy #blessed #thankful #grateful #celebration #festiveseason #indianfestival",
        ideas: "• Create a reel showing festival preparation steps\n• Share traditional recipes with modern twists\n• Post behind-the-scenes of decoration setup\n• Document family traditions being passed down\n• Create a carousel post with festival tips"
      },
      {
        headline: "🌟 New Year, New Opportunities!",
        caption: "January brings fresh beginnings and endless possibilities! 🎊\n\nAs we step into a new year, let's:\n✨ Set meaningful goals\n✨ Embrace positive changes\n✨ Create lasting memories\n\nWhat's one thing you're excited about this year? Drop it below! 👇\n\n#NewYear #FreshStart #Goals2025",
        hashtags: "#newyear #2025 #goals #resolutions #freshstart #motivation #inspiration #newbeginnings #positivity #growth #mindset #success #achievement #dreams #aspirations #opportunity #change #transformation #lifestyle #selfimprovement #personalDevelopment #mindfulness #gratitude #blessed #motivated #inspired #focus #determination #progress #journey",
        ideas: "• Create a goal-setting template for followers\n• Share your personal resolutions journey\n• Post motivational quotes with aesthetic backgrounds\n• Create a 'Year in Review' carousel\n• Document your first steps toward your goals"
      },
      {
        headline: "🏠 Republic Day Special: Celebrating Our Heritage",
        caption: "Today we celebrate the spirit of our nation! 🇮🇳 Republic Day reminds us of our rich heritage and the values that unite us.\n\nLet's honor our constitution and the diversity that makes India beautiful. Share your patriotic spirit in the comments! 🙏\n\n#RepublicDay #India #Heritage #Unity",
        hashtags: "#republicday #india #patriotic #heritage #unity #diversity #constitution #celebration #indian #proud #nation #freedom #democracy #tricolor #26january #indianflag #patriotism #culture #tradition #respect #honor #solidarity #independence #nationalday #indianheritage #proudindian #jaihind #unity #diversity #celebration #blessed",
        ideas: "• Share historical facts about Republic Day\n• Create content about Indian heritage sites\n• Post about unity in diversity\n• Share patriotic quotes with flag backgrounds\n• Create a reel about Indian achievements"
      }
    ],
    competitor: [
      {
        headline: "🚀 Standing Out in a Crowded Market",
        caption: "In a world full of similar content, how do you make yours shine? ✨\n\nHere's what sets successful creators apart:\n• Authentic storytelling\n• Consistent value delivery\n• Genuine engagement with audience\n• Unique perspective on common topics\n\nWhat makes your content different? Let me know! 💬\n\n#ContentCreator #Authenticity #StandOut",
        hashtags: "#contentcreator #authenticity #unique #standout #originalcontent #creativity #storytelling #engagement #audience #value #perspective #different #innovation #creative #inspiration #motivation #success #growth #personal #brand #influence #impact #community #connection #genuine #real #truth #honest #transparent #relatable",
        ideas: "• Analyze successful posts in your niche\n• Create content that fills gaps in the market\n• Share your unique point of view\n• Collaborate with other creators\n• Develop a signature style or format"
      },
      {
        headline: "💡 The Secret to Viral Content",
        caption: "Ever wondered why some posts go viral while others don't? 🤔\n\nHere's the formula:\n📱 Hook them in 3 seconds\n🎯 Provide instant value\n💬 Ask engaging questions\n🔄 Create shareable moments\n\nWhich tip will you try first? Comment below! 👇\n\n#ViralContent #ContentStrategy #Growth",
        hashtags: "#viralcontent #contentstrategy #growth #engagement #algorithm #reach #viral #trending #socialmedia #marketing #tips #strategy #success #influence #creator #content #posts #reels #stories #audience #followers #likes #shares #comments #interaction #community #organic #reach #discovery #explore",
        ideas: "• Create content that evokes strong emotions\n• Use trending audio and music\n• Post at optimal times for your audience\n• Create relatable, shareable content\n• Use eye-catching thumbnails and covers"
      },
      {
        headline: "🎯 Finding Your Niche Sweet Spot",
        caption: "Your niche isn't just what you post about—it's your unique angle! 🎪\n\nFind your sweet spot by:\n🔍 Identifying your expertise\n❤️ Following your passion\n👥 Understanding your audience\n💰 Considering monetization potential\n\nWhat's your niche? Share it below! 👇\n\n#NicheContent #FindYourVoice #ContentCreator",
        hashtags: "#niche #expertise #passion #audience #monetization #voice #creator #content #specialization #focus #target #market #brand #personal #identity #unique #positioning #strategy #growth #success #influence #authority #expert #knowledge #value #community #followers #engagement #authentic #genuine",
        ideas: "• Share your expertise through educational content\n• Create tutorials in your area of knowledge\n• Build a community around your niche\n• Collaborate with others in your field\n• Consistently deliver value to your audience"
      }
    ],
    trending: [
      {
        headline: "🔥 This Trend is Taking Over Instagram!",
        caption: "Have you seen this everywhere? This trend is absolutely viral right now! 🌟\n\nHere's why it's working:\n✨ Relatable content\n✨ Easy to participate\n✨ Encourages creativity\n✨ Perfect for engagement\n\nAre you jumping on this trend? Tag me if you do! 📱\n\n#TrendingNow #Viral #InstagramTrends",
        hashtags: "#trending #viral #trendingnow #instagramtrends #explore #fyp #foryou #reels #trending #popular #hot #viral #content #creator #engagement #reach #algorithm #discovery #new #latest #current #now #today #2025 #socialmedia #instagram #viral #trend #challenge #participate #join #fun #creative",
        ideas: "• Jump on trending audio tracks\n• Create your own version of popular formats\n• Use trending hashtags strategically\n• Participate in viral challenges\n• Create content around current events"
      },
      {
        headline: "📱 The Algorithm Changed - Here's What You Need to Know",
        caption: "Instagram's algorithm update is here! 🚨 Here's what creators need to know:\n\n🔄 Reels are still king\n💬 Comments matter more than likes\n⏰ Posting consistency is key\n🎯 Niche content performs better\n\nWhat changes have you noticed? Let's discuss! 💭\n\n#AlgorithmUpdate #InstagramTips #ContentStrategy",
        hashtags: "#algorithm #instagram #update #reels #engagement #content #strategy #creator #tips #growth #reach #visibility #performance #analytics #insights #social #media #marketing #organic #reach #discovery #explore #fyp #foryou #trending #viral #success #influence #audience #followers",
        ideas: "• Create educational content about algorithm changes\n• Share tips for better engagement\n• Document your growth journey\n• Create 'behind the scenes' content\n• Engage actively with your community"
      },
      {
        headline: "✨ Why Everyone's Talking About This Format",
        caption: "This content format is everywhere right now! 🌈\n\nWhy it's so effective:\n📊 Easy to consume\n🎯 Highly shareable\n💡 Educational value\n🔄 Perfect for repurposing\n\nHave you tried this format yet? Show me your version! 👇\n\n#ContentFormat #CreatorTips #InstagramStrategy",
        hashtags: "#contentformat #creator #tips #strategy #format #template #viral #trending #effective #engagement #reach #share #educational #value #repurpose #content #creation #instagram #reels #posts #stories #carousel #video #photo #creative #innovative #new #popular #successful #proven",
        ideas: "• Experiment with different content formats\n• Create templates for consistent posting\n• Repurpose content across formats\n• Test what works best for your audience\n• Stay updated with platform changes"
      }
    ]
  };

  return baseContent[request.generationType] || baseContent.trending;
}

export async function generateInstagramContent(request: ContentGenerationRequest): Promise<GeneratedContent[]> {
  // Require API key for real functionality
  if (!openai) {
    throw new Error('OpenAI API key is required for content generation');
  }

  try {
    let systemPrompt = `You are an expert Instagram content creator and social media strategist. Your task is to generate viral, engaging Instagram content that is optimized for Instagram's algorithm. 

Key requirements:
- Generate content specifically for the "${request.niche}" niche
- Include trending, algorithm-optimized hashtags (20-30 hashtags)
- Create engaging captions with hooks, storytelling, and call-to-actions
- Provide specific content ideas for posts/reels
- Make headlines attention-grabbing and scroll-stopping
- Consider Instagram best practices for engagement

Always respond with JSON in this exact format:
{
  "content": [
    {
      "headline": "Attention-grabbing headline",
      "caption": "Engaging caption with emojis, hooks, and CTAs",
      "hashtags": "#hashtag1 #hashtag2 #hashtag3...",
      "ideas": "Specific content creation ideas and tips"
    }
  ]
}`;

    let userPrompt = '';

    switch (request.generationType) {
      case 'date':
        userPrompt = `Generate 3 Instagram content ideas for the "${request.niche}" niche based on these upcoming Indian holidays and events:
        
${request.holidays?.map(h => `- ${h.name} (${h.date}): ${h.description}`).join('\n')}

Create content that ties the niche to these cultural moments and festivals. Make it relevant and engaging for Indian audiences.`;
        break;

      case 'competitor':
        let competitorAnalysis = `Competitors mentioned: ${request.competitors?.join(', ') || 'No specific competitors'}`;
        
        if (request.scrapedData && request.scrapedData.length > 0) {
          competitorAnalysis += '\n\nScraped competitor data:\n';
          request.scrapedData.forEach((profile: any) => {
            competitorAnalysis += `\n@${profile.username} (${profile.followers.toLocaleString()} followers, ${profile.following} following):\n`;
            competitorAnalysis += `Recent posts analysis:\n`;
            profile.posts.slice(0, 5).forEach((post: any, index: number) => {
              competitorAnalysis += `  ${index + 1}. Caption: "${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}"\n`;
              competitorAnalysis += `     Engagement: ${post.likes} likes, ${post.comments} comments\n`;
              if (post.hashtags.length > 0) {
                competitorAnalysis += `     Hashtags: ${post.hashtags.slice(0, 10).join(' ')}\n`;
              }
            });
            
            // Calculate average engagement
            const avgLikes = Math.round(profile.posts.reduce((sum: number, post: any) => sum + post.likes, 0) / profile.posts.length);
            const avgComments = Math.round(profile.posts.reduce((sum: number, post: any) => sum + post.comments, 0) / profile.posts.length);
            competitorAnalysis += `     Average engagement: ${avgLikes} likes, ${avgComments} comments per post\n`;
          });
        }

        userPrompt = `Generate 3 Instagram content ideas for the "${request.niche}" niche based on competitor analysis.

${competitorAnalysis}

Create unique, engaging content that stands out from typical posts in this niche. Focus on gaps in the market and trending topics that competitors might be missing. Use insights from the actual competitor data to create better content.`;
        break;

      case 'trending':
        userPrompt = `Generate 3 viral Instagram content ideas for the "${request.niche}" niche based on current trending topics and formats.

Focus on:
- Current trending audio/music formats
- Popular reel formats and challenges
- Trending hashtags in this niche
- Viral content patterns
- Seasonal trends and topics

Create content that has high viral potential and aligns with current Instagram algorithm preferences.`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"content": []}');
    return result.content || [];

  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content: " + (error as Error).message);
  }
}

// OpenAI streaming content refinement
export async function* refineContentStreamWithOpenAI(idea: any, message: string, chatHistory: any[]): AsyncGenerator<string, void, unknown> {
  if (!openai) {
    throw new Error('OpenAI API key not available');
  }

  try {
    const systemPrompt = buildInstagramExpertPrompt(idea, chatHistory, message);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error streaming content refinement with OpenAI:', error);
    yield "I'm experiencing technical difficulties. Please try your request again.";
  }
}

// Non-streaming OpenAI refinement
export async function refineContentWithOpenAI(idea: any, message: string, chatHistory: any[]): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not available');
  }

  try {
    const systemPrompt = buildInstagramExpertPrompt(idea, chatHistory, message);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "I'm having trouble processing your request. Please try again.";
  } catch (error) {
    console.error('Error refining content with OpenAI:', error);
    throw new Error('Failed to refine content. Please try again.');
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

export async function optimizeHashtags(niche: string, caption: string): Promise<string> {
  // Require API key for real functionality
  if (!openai) {
    throw new Error('OpenAI API key is required for hashtag optimization');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an Instagram hashtag optimization expert. Generate 25-30 optimized hashtags that will maximize reach and engagement for Instagram posts. Mix popular, medium, and niche-specific hashtags. Respond with JSON format: {\"hashtags\": \"#tag1 #tag2 #tag3...\"}"
        },
        {
          role: "user",
          content: `Optimize hashtags for this Instagram post:
          
Niche: ${niche}
Caption: ${caption}

Generate hashtags that are:
- Algorithm-optimized for 2024
- Mix of trending and niche-specific tags
- Include location-based tags if relevant
- Avoid banned or shadowbanned hashtags`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"hashtags": ""}');
    return result.hashtags || '';

  } catch (error) {
    console.error("Error optimizing hashtags:", error);
    throw new Error("Failed to optimize hashtags: " + (error as Error).message);
  }
}
