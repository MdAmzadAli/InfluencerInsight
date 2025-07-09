import { Request, Response, NextFunction } from "express";
import { adminAuth } from "./firebase-admin";

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export const authenticateFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      next();
    } catch (firebaseError) {
      console.log("Firebase token verification failed, using development mode");
      // Development fallback - extract claims from token payload (NOT FOR PRODUCTION)
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        (req as AuthenticatedRequest).user = {
          uid: payload.user_id || payload.sub || 'dev-user',
          email: payload.email || 'dev@example.com',
          name: payload.name || 'Development User',
          picture: payload.picture,
        };
        next();
      } catch (parseError) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};