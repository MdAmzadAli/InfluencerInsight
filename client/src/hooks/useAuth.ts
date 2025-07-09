import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user data from our backend when Firebase user is available
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!firebaseUser,
    retry: false,
  });

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!firebaseUser,
  };
}
