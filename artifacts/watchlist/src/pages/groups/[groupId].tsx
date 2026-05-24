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
  Settings, 
  Link as LinkIcon, 
  Copy, 
  CheckCircle2, 
  Trash2,
  Clock,
  Heart
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
          toast({
            title: "Invite link copied",
            description: "Anyone with this link can join the group.",
          });
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
          toast({
            title: "Movie added",
            description: `${movie.title} has been added to the group.`,
          });
        }
      }
    );
  };

  const filteredMovies = movies?.filter(m => {
    if (activeTab === "all") return true;
    return m.myStatus === activeTab;
  }) || [];

  if (groupLoading) {
    return <AppLayout><div className="p-8 text-muted-foreground animate-pulse">Loading group...</div></AppLayout>;
  }

  if (!group) {
    return <AppLayout><div className="p-8 text-muted-foreground">Group not found.</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            {group.description && <p className="text-muted-foreground max-w-2xl">{group.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateInvite}
              disabled={createInvite.isPending}
              className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              {isInviteCopied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
              {isInviteCopied ? "Copied!" : "Invite Link"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-card border border-border p-4 rounded-xl">
              <MovieSearch onSelect={handleAddMovie} />
            </div>

            <div>
              <div className="flex space-x-1 border-b border-border mb-6 overflow-x-auto">
                {(["all", "want_to_watch", "watched", "liked"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {tab === "all" ? "All Movies" : 
                     tab === "want_to_watch" ? "Want to Watch" : 
                     tab === "watched" ? "Watched" : "Liked"}
                  </button>
                ))}
              </div>

              {moviesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredMovies.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {filteredMovies.map((movie) => (
                    <Link key={movie.id} href={`/groups/${groupId}/movie/${movie.id}`}>
                      <div className="group relative aspect-[2/3] bg-muted rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors">
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <Film className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium">{movie.title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                          <h3 className="font-medium text-white truncate">{movie.title}</h3>
                          <p className="text-xs text-white/80">{movie.year}</p>
                        </div>
                        {movie.myStatus === "liked" && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border border-border border-dashed rounded-xl">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No movies found</p>
                  <p className="text-muted-foreground">
                    {activeTab === "all" ? "Search above to add your first movie." : `You haven't marked any movies as ${activeTab.replace(/_/g, ' ')}.`}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Members
              </h2>
              <ul className="space-y-3">
                {members?.map(member => (
                  <li key={member.id} className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.displayName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">
                        {member.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{member.displayName}</span>
                      <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {stats && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">Group Stats</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Movies</span>
                    <span className="font-medium">{stats.totalMovies}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Want to Watch</span>
                    <span className="font-medium">{stats.statusCounts.want_to_watch || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Watched</span>
                    <span className="font-medium">{stats.statusCounts.watched || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}