import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from our backend
  const { data: user, isLoading: queryLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    setIsLoading(queryLoading);
  }, [queryLoading]);

  return {
    user,
    firebaseUser: user, // For compatibility
    isLoading,
    isAuthenticated: !!user && !error,
  };
}