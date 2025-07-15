import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

const ratingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface RatingPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: string;
  title?: string;
  description?: string;
}

export function RatingPopup({ 
  open, 
  onOpenChange, 
  context = 'general',
  title = "How was your experience?",
  description = "Your feedback helps us improve!"
}: RatingPopupProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const submitRating = useMutation({
    mutationFn: async (data: RatingFormData) => {
      return apiRequest('/api/ratings', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          rating: data.rating,
          comment: data.comment,
          context,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your rating!",
        description: "Your feedback helps us improve the app.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error submitting rating",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RatingFormData) => {
    if (data.rating === 0) {
      form.setError('rating', { message: 'Please select a rating' });
      return;
    }
    submitRating.mutate(data);
  };

  const handleStarClick = (rating: number) => {
    form.setValue('rating', rating);
  };

  const currentRating = form.watch('rating');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            {description}
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-center block">Rate your experience</FormLabel>
                  <FormControl>
                    <div className="flex justify-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => handleStarClick(star)}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= (hoveredRating || currentRating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional comments (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us more about your experience..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={submitRating.isPending || currentRating === 0}
                className="gap-2"
              >
                {submitRating.isPending ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Submit Rating
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Hook to trigger rating popup
export function useRatingPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState('general');
  const [title, setTitle] = useState('How was your experience?');
  const [description, setDescription] = useState('Your feedback helps us improve!');

  const showRating = (
    ratingContext: string = 'general',
    ratingTitle?: string,
    ratingDescription?: string
  ) => {
    setContext(ratingContext);
    if (ratingTitle) setTitle(ratingTitle);
    if (ratingDescription) setDescription(ratingDescription);
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    context,
    title,
    description,
    showRating,
  };
}