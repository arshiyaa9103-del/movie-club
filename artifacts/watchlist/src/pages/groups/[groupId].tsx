import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetGroup, 
  useGetGroupMovies, 
  useGetGroupStats, 
  useGetGroupMembers,
  useCreateInvite,
  useAddGroupMovie,
  useRemoveGroupMovie,
  getGetGroupQueryKey,
  getGetGroupMoviesQueryKey,
  getGetGroupStatsQueryKey,
  getGetGroupMembersQueryKey
} from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MovieSearch } from "@/components/MovieSearch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Film, 
  Link as LinkIcon, 
  CheckCircle2, 
  Clock,
  Heart,
  Check,
  Trophy
} from "lucide-react";

export default function GroupPage() {
  const [, params] = useRoute("/groups/:groupId");
  const groupId = parseInt(params?.groupId || "0", 10);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"all" | "want_to_watch" | "watched" | "liked">("all");
  const [isInviteCopied, setIsInviteCopied] = useState(false);

  const { data: group, isLoading: groupLoading } = useGetGroup(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupQueryKey(groupId) } });
  const { data: movies, isLoading: moviesLoading } = useGetGroupMovies(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupMoviesQueryKey(groupId) } });
  const { data: stats } = useGetGroupStats(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupStatsQueryKey(groupId) } });
  const { data: members } = useGetGroupMembers(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupMembersQueryKey(groupId) } });

  const createInvite = useCreateInvite();
  const addMovie = useAddGroupMovie();
  const removeMovie = useRemoveGroupMovie();

  const handleCreateInvite = () => {
    createInvite.mutate(
      { groupId },
      {
        onSuccess: (invite) => {
          const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/invite/${invite.token}`;
          navigator.clipboard.writeText(url);
          setIsInviteCopied(true);
          setTimeout(() => setIsInviteCopied(false), 2000);
          toast({ title: "Invite link copied", description: "Anyone with this link can join the group." });
        }
      }
    );
  };

  const handleAddMovie = (movie: any) => {
    addMovie.mutate(
      {
        groupId,
        data: {
          imdbId: movie.imdbId,
          title: movie.title,
          year: movie.year,
          poster: movie.poster !== "N/A" ? movie.poster : null,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Movie added", description: `${movie.title} has been added to the group.` });
        }
      }
    );
  };

  const filteredMovies = movies?.filter(m => {
    if (activeTab === "all") return true;
    return m.myStatus === activeTab;
  }) || [];

  if (groupLoading) {
    return <AppLayout><div className="p-8 text-[#8a8cac] animate-pulse">Loading group...</div></AppLayout>;
  }
  if (!group) {
    return <AppLayout><div className="p-8 text-[#8a8cac]">Group not found.</div></AppLayout>;
  }

  const tabs = [
    { key: "all", label: "All" },
    { key: "want_to_watch", label: "Want to Watch", icon: Clock },
    { key: "watched", label: "Watched", icon: Check },
    { key: "liked", label: "Liked", icon: Heart },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#e8eaf2] mb-2">{group.name}</h1>
            {group.description && <p className="text-[#8a8cac] max-w-2xl">{group.description}</p>}
          </div>
          <button
            onClick={handleCreateInvite}
            disabled={createInvite.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all glass glass-hover"
            style={{ color: isInviteCopied ? "#6ee7b7" : "#8387c3" }}
          >
            {isInviteCopied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            {isInviteCopied ? "Copied!" : "Invite Link"}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="glass rounded-2xl p-4">
              <MovieSearch onSelect={handleAddMovie} />
            </div>

            <div>
              <div className="flex space-x-1 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.key
                        ? "text-[#e8eaf2]"
                        : "text-[#8a8cac] hover:text-[#e8eaf2]"
                    }`}
                    style={activeTab === tab.key ? {
                      background: "rgba(131,135,195,0.2)",
                      border: "1px solid rgba(131,135,195,0.25)",
                    } : {}}
                  >
                    {"icon" in tab && tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {moviesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl animate-pulse" style={{ background: "rgba(58,62,108,0.35)" }} />
                  ))}
                </div>
              ) : filteredMovies.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMovies.map((movie) => (
                    <Link key={movie.id} href={`/groups/${groupId}/movie/${movie.id}`}>
                      <div className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all"
                        style={{ border: "1px solid rgba(149,155,181,0.15)" }}>
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center glass">
                            <Film className="w-8 h-8 text-[#8387c3] mb-2 opacity-60" />
                            <span className="text-xs font-medium text-[#959bb5]">{movie.title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1123]/90 via-[#0a1123]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <h3 className="font-semibold text-sm text-white truncate">{movie.title}</h3>
                          <p className="text-xs text-white/70">{movie.year}</p>
                        </div>
                        {movie.myStatus === "liked" && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: "#8387c3" }}>
                            <Heart className="w-3.5 h-3.5 fill-current text-[#0a1123]" />
                          </div>
                        )}
                        {movie.myStatus === "watched" && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: "rgba(35,40,80,0.85)", border: "1px solid rgba(131,135,195,0.4)" }}>
                            <Check className="w-3.5 h-3.5 text-[#8387c3]" />
                          </div>
                        )}
                        {movie.myStatus === "want_to_watch" && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                            style={{ background: "rgba(35,40,80,0.85)", border: "1px solid rgba(131,135,195,0.3)" }}>
                            <Clock className="w-3.5 h-3.5 text-[#959bb5]" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 glass rounded-2xl border-dashed">
                  <Film className="w-12 h-12 text-[#8a8cac] mx-auto mb-4 opacity-40" />
                  <p className="text-base font-medium text-[#e8eaf2]">No movies here yet</p>
                  <p className="text-[#8a8cac] text-sm mt-1">
                    {activeTab === "all" ? "Search above to add your first movie." : `No movies marked as ${activeTab.replace(/_/g, ' ')}.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-[#e8eaf2]">
                <Users className="w-4 h-4 text-[#8387c3]" />
                Members
              </h2>
              <ul className="space-y-3">
                {members?.map(member => (
                  <li key={member.id} className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.displayName} className="w-8 h-8 rounded-full ring-1 ring-[rgba(131,135,195,0.25)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ background: "rgba(131,135,195,0.2)", color: "#8387c3" }}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-[#e8eaf2]">{member.displayName}</span>
                      <span className="text-xs text-[#8a8cac] block capitalize">{member.role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {stats && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-semibold mb-4 text-[#e8eaf2]">Stats</h2>
                <div className="space-y-3">
                  {[
                    { label: "Total Movies", value: stats.totalMovies },
                    { label: "Want to Watch", value: stats.statusCounts.want_to_watch || 0 },
                    { label: "Watched", value: stats.statusCounts.watched || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm text-[#8a8cac]">{label}</span>
                      <span className="font-semibold text-[#e8eaf2] tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats?.topLiked && stats.topLiked.length > 0 && (
              <div className="glass rounded-2xl p-5">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-[#e8eaf2]">
                  <Trophy className="w-4 h-4 text-[#8387c3]" />
                  Top Picks
                </h2>
                <ul className="space-y-3">
                  {stats.topLiked.map((movie, index) => {
                    const likedCount = movie.statusCounts?.liked || 0;
                    return (
                      <li key={movie.id}>
                        <Link href={`/groups/${groupId}/movie/${movie.id}`}>
                          <div className="flex items-center gap-3 group cursor-pointer rounded-xl p-1.5 -mx-1.5 transition-colors hover:bg-[rgba(131,135,195,0.08)]">
                            <span className="w-5 text-xs font-bold tabular-nums text-center shrink-0"
                              style={{ color: index === 0 ? "#f5c842" : index === 1 ? "#b0b3d6" : "#8a8cac" }}>
                              {index + 1}
                            </span>
                            {movie.poster ? (
                              <img src={movie.poster} alt={movie.title}
                                className="w-9 h-12 object-cover rounded-md shrink-0"
                                style={{ border: "1px solid rgba(149,155,181,0.15)" }} />
                            ) : (
                              <div className="w-9 h-12 rounded-md shrink-0 flex items-center justify-center"
                                style={{ background: "rgba(58,62,108,0.4)", border: "1px solid rgba(149,155,181,0.15)" }}>
                                <Film className="w-4 h-4 text-[#8387c3] opacity-60" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#e8eaf2] truncate group-hover:text-[#8387c3] transition-colors">{movie.title}</p>
                              <p className="text-xs text-[#8a8cac]">{movie.year}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Heart className="w-3.5 h-3.5 fill-current text-[#8387c3]" />
                              <span className="text-xs font-semibold text-[#8387c3]">{likedCount}</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
