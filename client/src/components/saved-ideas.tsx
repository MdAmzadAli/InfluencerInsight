import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ScheduleModal from "./schedule-modal";
import ContentEditor from "./content-editor";
import { useState } from "react";
import { Edit3 } from "lucide-react";
import type { ContentIdea } from "@shared/schema";

export default function SavedIdeas() {
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ContentIdea | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedIdeas = [], isLoading } = useQuery({
    queryKey: ["/api/content/ideas/saved"],
    retry: false,
  });

  const unsaveIdeaMutation = useMutation({
    mutationFn: async (ideaId: number) => {
      const response = await apiRequest(`/api/content/ideas/${ideaId}/save`, { 
        method: "PATCH",
        body: JSON.stringify({ isSaved: false })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/ideas/saved"] });
      toast({
        title: "Success",
        description: "Idea removed from saved list!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScheduleIdea = (idea: ContentIdea) => {
    setSelectedIdea(idea);
    setShowScheduleModal(true);
  };

  const handleUnsaveIdea = (ideaId: number) => {
    unsaveIdeaMutation.mutate(ideaId);
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditingIdea(idea);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setEditingIdea(null);
    setShowEditor(false);
  };

  const handleEditorSave = (updatedIdea: ContentIdea) => {
    setEditingIdea(null);
    setShowEditor(false);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <div className="w-8 h-8 instagram-gradient rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Saved Ideas</h2>
        <p className="text-gray-600">Your collection of saved content ideas</p>
      </div>

      {savedIdeas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bookmark text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Ideas</h3>
            <p className="text-gray-600 mb-4">
              You haven't saved any content ideas yet. Generate some ideas and save your favorites!
            </p>
            <Button className="instagram-gradient text-white hover:opacity-90">
              Generate Ideas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {savedIdeas.map((idea: ContentIdea) => (
            <Card key={idea.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex-1">
                    {idea.headline}
                  </h4>
                  <button 
                    onClick={() => handleUnsaveIdea(idea.id)}
                    className="text-yellow-500 hover:text-gray-400 ml-2"
                    title="Remove from saved"
                  >
                    <i className="fas fa-bookmark"></i>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CAPTION</label>
                    <p className="text-sm text-gray-700 line-clamp-3">{idea.caption}</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">HASHTAGS</label>
                    <p className="text-xs text-blue-600 break-all line-clamp-2">{idea.hashtags}</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">CONTENT IDEAS</label>
                    <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line">{idea.ideas}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    onClick={() => handleScheduleIdea(idea)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm"
                  >
                    Schedule
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 text-sm"
                    onClick={() => handleEditIdea(idea)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Generated via {idea.generationType} • {new Date(idea.createdAt!).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showScheduleModal && selectedIdea && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          idea={selectedIdea}
        />
      )}

      {showEditor && editingIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ContentEditor
            content={editingIdea}
            type="idea"
            onClose={handleEditorClose}
            onSave={handleEditorSave}
          />
        </div>
      )}
    </div>
  );
}
