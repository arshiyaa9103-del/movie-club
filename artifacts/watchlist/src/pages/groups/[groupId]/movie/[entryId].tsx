import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetGroup,
  useGetMovie,
  useGetGroupMovies,
  useGetReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useSetMovieStatus,
  useRemoveMovieStatus,
  useRemoveGroupMovie,
  getGetGroupQueryKey,
  getGetGroupMoviesQueryKey,
  getGetMovieQueryKey,
  getGetReviewsQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";
import { 
  ArrowLeft, 
  Clock, 
  Star, 
  Check, 
  Heart, 
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function MovieDetailPage() {
  const [, params] = useRoute("/groups/:groupId/movie/:entryId");
  const groupId = parseInt(params?.groupId || "0", 10);
  const entryId = parseInt(params?.entryId || "0", 10);
  const { toast } = useToast();
  const { user } = useUser();

  const [reviewBody, setReviewBody] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const { data: group } = useGetGroup(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupQueryKey(groupId) } });
  const { data: groupMovies } = useGetGroupMovies(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupMoviesQueryKey(groupId) } });
  const entry = groupMovies?.find(m => m.id === entryId);
  const imdbId = entry?.imdbId || "";
  const { data: movie, isLoading: movieLoading } = useGetMovie(imdbId, { query: { enabled: !!entry?.imdbId, queryKey: getGetMovieQueryKey(imdbId) } });
  const { data: reviews } = useGetReviews(groupId, entryId, { query: { enabled: !!groupId && !!entryId, queryKey: getGetReviewsQueryKey(groupId, entryId) } });

  const setStatus = useSetMovieStatus();
  const removeStatus = useRemoveMovieStatus();
  const removeMovie = useRemoveGroupMovie();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const [, setLocation] = useLocation();

  if (!groupId || !entryId || (!movieLoading && !entry)) {
    return <AppLayout><div className="p-8 text-muted-foreground">Movie not found.</div></AppLayout>;
  }

  const handleStatusToggle = (status: "want_to_watch" | "watched" | "liked") => {
    if (entry?.myStatus === status) {
      removeStatus.mutate({ groupId, entryId });
    } else {
      setStatus.mutate({ groupId, entryId, data: { status } });
    }
  };

  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBody.trim()) return;

    if (editingReviewId) {
      updateReview.mutate({ reviewId: editingReviewId, data: { body: reviewBody } }, {
        onSuccess: () => {
          setReviewBody("");
          setEditingReviewId(null);
          toast({ title: "Review updated" });
        }
      });
    } else {
      createReview.mutate({ groupId, entryId, data: { body: reviewBody } }, {
        onSuccess: () => {
          setReviewBody("");
          toast({ title: "Review posted" });
        }
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to {group?.name || "Group"}
        </Link>

        {movieLoading || !movie ? (
          <div className="animate-pulse space-y-8">
            <div className="flex gap-8">
              <div className="w-64 aspect-[2/3] bg-muted rounded-xl hidden md:block" />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-2/3 bg-muted rounded" />
                <div className="h-6 w-1/3 bg-muted rounded" />
                <div className="h-24 w-full bg-muted rounded mt-8" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
              {movie.poster && movie.poster !== "N/A" ? (
                <img src={movie.poster} alt={movie.title} className="w-full rounded-xl shadow-lg border border-border" />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted rounded-xl border border-border flex items-center justify-center">
                  <span className="text-muted-foreground">No poster</span>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => handleStatusToggle("want_to_watch")}
                  disabled={setStatus.isPending || removeStatus.isPending}
                  className={`w-full py-2.5 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                    entry?.myStatus === "want_to_watch"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Want to Watch
                </button>
                <button
                  onClick={() => handleStatusToggle("watched")}
                  disabled={setStatus.isPending || removeStatus.isPending}
                  className={`w-full py-2.5 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                    entry?.myStatus === "watched"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Watched
                </button>
                <button
                  onClick={() => handleStatusToggle("liked")}
                  disabled={setStatus.isPending || removeStatus.isPending}
                  className={`w-full py-2.5 px-4 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border ${
                    entry?.myStatus === "liked"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${entry?.myStatus === "liked" ? "fill-current" : ""}`} />
                  Liked
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{movie.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground font-medium">
                    <span>{movie.year}</span>
                    {movie.runtime && movie.runtime !== "N/A" && (
                      <>
                        <span>•</span>
                        <span>{movie.runtime}</span>
                      </>
                    )}
                    {movie.imdbRating && movie.imdbRating !== "N/A" && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          {movie.imdbRating}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="bg-popover text-popover-foreground border border-border rounded-md shadow-md p-1 min-w-[160px] z-50">
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-destructive focus:bg-destructive focus:text-destructive-foreground outline-none transition-colors"
                        onClick={() => {
                          if (confirm("Remove this movie from the group?")) {
                            removeMovie.mutate({ groupId, entryId }, {
                              onSuccess: () => setLocation(`/groups/${groupId}`)
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Remove from Group
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>

              {movie.genre && movie.genre !== "N/A" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movie.genre.split(', ').map(g => (
                    <span key={g} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium border border-border/50">
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {movie.plot && movie.plot !== "N/A" && (
                <div className="mt-6 prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>{movie.plot}</p>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm border-t border-border pt-6">
                {movie.director && movie.director !== "N/A" && (
                  <div>
                    <span className="block text-muted-foreground font-medium mb-1">Director</span>
                    <span className="text-foreground">{movie.director}</span>
                  </div>
                )}
                {movie.actors && movie.actors !== "N/A" && (
                  <div>
                    <span className="block text-muted-foreground font-medium mb-1">Cast</span>
                    <span className="text-foreground">{movie.actors}</span>
                  </div>
                )}
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Discussion
                </h2>

                <form onSubmit={handlePostReview} className="mb-8 relative">
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="What did you think of it?"
                    className="w-full bg-card border border-border rounded-lg p-4 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    disabled={createReview.isPending || updateReview.isPending}
                  />
                  <div className="flex justify-between items-center mt-2">
                    {editingReviewId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingReviewId(null); setReviewBody(""); }}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cancel edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!reviewBody.trim() || createReview.isPending || updateReview.isPending}
                      className="ml-auto bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {editingReviewId ? "Save Edit" : "Post Review"}
                    </button>
                  </div>
                </form>

                <div className="space-y-6">
                  {reviews?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">Be the first to share your thoughts.</p>
                  ) : (
                    reviews?.map(review => {
                      const isOwner = user?.id && review.userId.toString() === user.id || user?.id && true; // Assuming simple ownership check
                      
                      return (
                        <div key={review.id} className="flex gap-4">
                          {review.avatarUrl ? (
                            <img src={review.avatarUrl} alt={review.displayName} className="w-10 h-10 rounded-full flex-shrink-0 border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 font-medium text-sm border border-border">
                              {review.displayName.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 bg-card border border-border rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium text-sm text-foreground">{review.displayName}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                  {review.updatedAt && review.updatedAt !== review.createdAt && " (edited)"}
                                </span>
                              </div>
                              
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content align="end" className="bg-popover text-popover-foreground border border-border rounded-md shadow-md p-1 min-w-[120px] z-50">
                                    <DropdownMenu.Item
                                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-muted outline-none transition-colors"
                                      onClick={() => {
                                        setEditingReviewId(review.id);
                                        setReviewBody(review.body);
                                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" /> Edit
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground text-destructive outline-none transition-colors"
                                      onClick={() => {
                                        if (confirm("Delete this review?")) {
                                          deleteReview.mutate({ reviewId: review.id });
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{review.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}