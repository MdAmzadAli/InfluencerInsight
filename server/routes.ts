import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateInstagramContent, optimizeHashtags } from "./openai";
import { 
  insertContentIdeaSchema, 
  insertScheduledPostSchema,
  updateUserSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed holidays on startup
  await storage.seedHolidays();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/user/niche', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { niche, competitors } = updateUserSchema.parse(req.body);
      
      const user = await storage.updateUserNiche(userId, niche || '', competitors || undefined);
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ message: "Failed to update user niche" });
    }
  });

  // Content generation routes
  app.post('/api/content/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { generationType, context } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user?.niche) {
        return res.status(400).json({ message: "User niche not set" });
      }

      let holidays;
      if (generationType === 'date') {
        holidays = await storage.getUpcomingHolidays(10);
      }

      // Scrape competitor data if competitors are provided and generation type is competitor
      let scrapedData: any[] = [];
      const competitors = user.competitors ? user.competitors.split(',').map(c => c.trim()) : [];
      
      if (generationType === 'competitor' && competitors.length > 0) {
        try {
          const { instagramScraper } = await import('./instagram-scraper');
          const competitorUsernames = competitors.map(c => c.replace('@', '').trim());
          
          console.log('Scraping Instagram profiles:', competitorUsernames);
          scrapedData = await instagramScraper.scrapeMultipleProfiles(competitorUsernames, 10);
          console.log('Successfully scraped data for', scrapedData.length, 'profiles');
        } catch (error) {
          console.error('Instagram scraping failed:', error);
          // Continue without scraped data - the AI will still generate content based on competitor names
        }
      }

      const generatedContent = await generateInstagramContent({
        niche: user.niche,
        generationType,
        context,
        competitors,
        scrapedData,
        holidays: holidays?.map(h => ({
          name: h.name,
          date: h.date.toISOString(),
          description: h.description || ''
        }))
      });

      // Save generated ideas to database
      const savedIdeas = [];
      for (const content of generatedContent) {
        const idea = await storage.createContentIdea({
          userId,
          headline: content.headline,
          caption: content.caption,
          hashtags: content.hashtags,
          ideas: content.ideas,
          generationType,
          isSaved: false
        });
        savedIdeas.push(idea);
      }

      res.json(savedIdeas);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Content ideas routes
  app.get('/api/content/ideas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ideas = await storage.getUserContentIdeas(userId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching content ideas:", error);
      res.status(500).json({ message: "Failed to fetch content ideas" });
    }
  });

  app.get('/api/content/ideas/saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedIdeas = await storage.getSavedContentIdeas(userId);
      res.json(savedIdeas);
    } catch (error) {
      console.error("Error fetching saved ideas:", error);
      res.status(500).json({ message: "Failed to fetch saved ideas" });
    }
  });

  app.patch('/api/content/ideas/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { isSaved } = req.body;
      
      await storage.updateContentIdeaSaved(ideaId, isSaved);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating saved status:", error);
      res.status(500).json({ message: "Failed to update saved status" });
    }
  });

  // Scheduled posts routes
  app.post('/api/posts/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertScheduledPostSchema.parse({
        ...req.body,
        userId
      });
      
      const scheduledPost = await storage.createScheduledPost(postData);
      res.json(scheduledPost);
    } catch (error) {
      console.error("Error scheduling post:", error);
      res.status(500).json({ message: "Failed to schedule post" });
    }
  });

  app.get('/api/posts/scheduled', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scheduledPosts = await storage.getUserScheduledPosts(userId);
      res.json(scheduledPosts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ message: "Failed to fetch scheduled posts" });
    }
  });

  app.patch('/api/posts/scheduled/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedPost = await storage.updateScheduledPost(postId, updates);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ message: "Failed to update scheduled post" });
    }
  });

  app.delete('/api/posts/scheduled/:id', isAuthenticated, async (req: any, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deleteScheduledPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      res.status(500).json({ message: "Failed to delete scheduled post" });
    }
  });

  // Hashtag optimization route
  app.post('/api/content/optimize-hashtags', isAuthenticated, async (req: any, res) => {
    try {
      const { niche, caption } = req.body;
      const optimizedHashtags = await optimizeHashtags(niche, caption);
      res.json({ hashtags: optimizedHashtags });
    } catch (error) {
      console.error("Error optimizing hashtags:", error);
      res.status(500).json({ message: "Failed to optimize hashtags" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
