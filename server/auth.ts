import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !(req.session as any).user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionUser = (req.session as any).user;
    
    (req as AuthenticatedRequest).user = {
      uid: sessionUser.id || 'demo-user',
      email: sessionUser.email || 'demo@example.com',
      name: sessionUser.name || 'Demo User',
      picture: sessionUser.picture,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};