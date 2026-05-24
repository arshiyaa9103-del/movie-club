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
  const [, setLocation] = useLocation();

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

  if (!groupId || !entryId || (!movieLoading && !entry)) {
    return <AppLayout><div className="p-8 text-[#8a8cac]">Movie not found.</div></AppLayout>;
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
        onSuccess: () => { setReviewBody(""); setEditingReviewId(null); toast({ title: "Review updated" }); }
      });
    } else {
      createReview.mutate({ groupId, entryId, data: { body: reviewBody } }, {
        onSuccess: () => { setReviewBody(""); toast({ title: "Review posted" }); }
      });
    }
  };

  const statusButtons = [
    { key: "want_to_watch" as const, label: "Want to Watch", Icon: Clock },
    { key: "watched" as const, label: "Watched", Icon: Check },
    { key: "liked" as const, label: "Liked", Icon: Heart },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-2 text-sm text-[#8a8cac] hover:text-[#e8eaf2] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to {group?.name || "Group"}
        </Link>

        {movieLoading || !movie ? (
          <div className="animate-pulse space-y-8">
            <div className="flex gap-8">
              <div className="w-64 aspect-[2/3] rounded-2xl hidden md:block" style={{ background: "rgba(58,62,108,0.35)" }} />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-2/3 rounded-xl" style={{ background: "rgba(58,62,108,0.35)" }} />
                <div className="h-6 w-1/3 rounded-xl" style={{ background: "rgba(58,62,108,0.35)" }} />
                <div className="h-24 w-full rounded-xl mt-8" style={{ background: "rgba(58,62,108,0.35)" }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Poster + status */}
            <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
              {movie.poster && movie.poster !== "N/A" ? (
                <img src={movie.poster} alt={movie.title}
                  className="w-full rounded-2xl shadow-2xl"
                  style={{ border: "1px solid rgba(149,155,181,0.15)", boxShadow: "0 20px 60px rgba(10,17,35,0.6)" }} />
              ) : (
                <div className="w-full aspect-[2/3] glass rounded-2xl flex items-center justify-center">
                  <span className="text-[#8a8cac]">No poster</span>
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2.5">
                {statusButtons.map(({ key, label, Icon }) => {
                  const isActive = entry?.myStatus === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleStatusToggle(key)}
                      disabled={setStatus.isPending || removeStatus.isPending}
                      className="w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      style={isActive ? {
                        background: "#8387c3",
                        color: "#0a1123",
                        boxShadow: "0 0 20px rgba(131,135,195,0.3)",
                      } : {
                        background: "rgba(58,62,108,0.22)",
                        color: "#959bb5",
                        border: "1px solid rgba(149,155,181,0.12)",
                      }}
                    >
                      <Icon className={`w-4 h-4 ${key === "liked" && isActive ? "fill-current" : ""}`} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-[#e8eaf2] tracking-tight">{movie.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-[#8a8cac] font-medium">
                    <span>{movie.year}</span>
                    {movie.runtime && movie.runtime !== "N/A" && (
                      <><span>·</span><span>{movie.runtime}</span></>
                    )}
                    {movie.imdbRating && movie.imdbRating !== "N/A" && (
                      <><span>·</span>
                      <span className="flex items-center gap-1" style={{ color: "#f5c842" }}>
                        <Star className="w-4 h-4 fill-current" />
                        {movie.imdbRating}
                      </span></>
                    )}
                  </div>
                </div>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="p-2 rounded-xl transition-colors text-[#8a8cac] hover:text-[#e8eaf2]"
                      style={{ background: "rgba(58,62,108,0.22)", border: "1px solid rgba(149,155,181,0.12)" }}>
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="rounded-xl p-1 min-w-[160px] z-50"
                      style={{ background: "rgba(14,20,48,0.97)", border: "1px solid rgba(149,155,181,0.18)", backdropFilter: "blur(20px)", boxShadow: "0 16px 40px rgba(10,17,35,0.6)" }}>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors text-[#d95f6e] hover:bg-[rgba(217,95,110,0.15)]"
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
                    <span key={g} className="glass-pill px-3 py-1 rounded-full text-xs font-medium text-[#959bb5]">{g}</span>
                  ))}
                </div>
              )}

              {movie.plot && movie.plot !== "N/A" && (
                <p className="mt-5 text-sm text-[#8a8cac] leading-relaxed">{movie.plot}</p>
              )}

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm border-t border-[rgba(149,155,181,0.1)] pt-6">
                {movie.director && movie.director !== "N/A" && (
                  <div>
                    <span className="block text-[#8a8cac] text-xs font-medium mb-1 uppercase tracking-wider">Director</span>
                    <span className="text-[#e8eaf2]">{movie.director}</span>
                  </div>
                )}
                {movie.actors && movie.actors !== "N/A" && (
                  <div>
                    <span className="block text-[#8a8cac] text-xs font-medium mb-1 uppercase tracking-wider">Cast</span>
                    <span className="text-[#e8eaf2]">{movie.actors}</span>
                  </div>
                )}
              </div>

              {/* Discussion */}
              <div className="mt-12 pt-8 border-t border-[rgba(149,155,181,0.1)]">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#e8eaf2]">
                  <MessageSquare className="w-5 h-5 text-[#8387c3]" />
                  Discussion
                </h2>

                <form onSubmit={handlePostReview} className="mb-8">
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="What did you think of it?"
                    className="w-full glass-input rounded-2xl p-4 min-h-[100px] text-sm resize-y text-[#e8eaf2]"
                    disabled={createReview.isPending || updateReview.isPending}
                  />
                  <div className="flex justify-between items-center mt-2.5">
                    {editingReviewId && (
                      <button type="button" onClick={() => { setEditingReviewId(null); setReviewBody(""); }}
                        className="text-xs text-[#8a8cac] hover:text-[#e8eaf2] transition-colors">
                        Cancel edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!reviewBody.trim() || createReview.isPending || updateReview.isPending}
                      className="ml-auto px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: "#8387c3", color: "#0a1123" }}
                    >
                      {editingReviewId ? "Save Edit" : "Post Review"}
                    </button>
                  </div>
                </form>

                <div className="space-y-5">
                  {reviews?.length === 0 ? (
                    <p className="text-center text-[#8a8cac] py-8 glass rounded-2xl border-dashed text-sm opacity-70">
                      Be the first to share your thoughts.
                    </p>
                  ) : (
                    reviews?.map(review => (
                      <div key={review.id} className="flex gap-4">
                        {review.avatarUrl ? (
                          <img src={review.avatarUrl} alt={review.displayName}
                            className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-[rgba(131,135,195,0.25)]" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                            style={{ background: "rgba(131,135,195,0.2)", color: "#8387c3" }}>
                            {review.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 glass rounded-2xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold text-sm text-[#e8eaf2]">{review.displayName}</span>
                              <span className="text-xs text-[#8a8cac] ml-2">
                                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                {review.updatedAt && review.updatedAt !== review.createdAt && " (edited)"}
                              </span>
                            </div>
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button className="text-[#8a8cac] hover:text-[#e8eaf2] opacity-60 hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content align="end" className="rounded-xl p-1 min-w-[120px] z-50"
                                  style={{ background: "rgba(14,20,48,0.97)", border: "1px solid rgba(149,155,181,0.18)", backdropFilter: "blur(20px)", boxShadow: "0 8px 24px rgba(10,17,35,0.5)" }}>
                                  <DropdownMenu.Item
                                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors text-[#959bb5] hover:text-[#e8eaf2] hover:bg-[rgba(131,135,195,0.1)]"
                                    onClick={() => { setEditingReviewId(review.id); setReviewBody(review.body); }}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors text-[#d95f6e] hover:bg-[rgba(217,95,110,0.12)]"
                                    onClick={() => { if (confirm("Delete this review?")) deleteReview.mutate({ reviewId: review.id }); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>
                          <p className="text-sm text-[#d0d2e0] whitespace-pre-wrap leading-relaxed">{review.body}</p>
                        </div>
                      </div>
                    ))
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
