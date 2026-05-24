import { useEffect } from "react";
import { useUser } from "@clerk/react";
import { useUpsertMe, useGetGroups, useGetMyActivity } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Users, Film, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user } = useUser();
  const upsertMe = useUpsertMe();

  const { data: groups, isLoading: groupsLoading } = useGetGroups();
  const { data: activity, isLoading: activityLoading } = useGetMyActivity();

  useEffect(() => {
    if (user && !upsertMe.isPending && !upsertMe.isSuccess) {
      upsertMe.mutate({
        data: {
          displayName: user.fullName || user.primaryEmailAddress?.emailAddress || "Unknown User",
          avatarUrl: user.imageUrl,
        }
      });
    }
  }, [user, upsertMe]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Welcome back</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Groups
                </h2>
                <Link href="/groups/new" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Create new <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {groupsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : groups?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <Link key={group.id} href={`/groups/${group.id}`}>
                      <div className="bg-card hover:bg-muted/50 border border-border rounded-xl p-5 transition-colors h-full flex flex-col cursor-pointer hover-elevate">
                        <h3 className="font-semibold text-lg mb-1 truncate">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Film className="w-3.5 h-3.5" />
                            {group.movieCount} movies
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">You haven't joined any groups yet.</p>
                  <Link href="/groups/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                    Create a Group
                  </Link>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Recent Activity
              </h2>

              {activityLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-md animate-pulse" />
                  ))}
                </div>
              ) : activity?.length ? (
                <ul className="space-y-4">
                  {activity.slice(0, 8).map(item => (
                    <li key={item.id} className="text-sm border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-1">
                        <span>
                          <span className="font-semibold text-foreground">{item.actorName}</span>{' '}
                          <span className="text-muted-foreground">{item.detail}</span>
                        </span>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {item.movieTitle && <span className="font-medium text-foreground/80 truncate max-w-[150px]">{item.movieTitle}</span>}
                          <span>in {item.groupName}</span>
                          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}