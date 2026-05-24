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

  const isGuest = (user as any)?.isAnonymous === true;

  useEffect(() => {
    if (user && !upsertMe.isPending && !upsertMe.isSuccess) {
      upsertMe.mutate({
        data: {
          displayName: isGuest ? "Guest" : (user.fullName || user.primaryEmailAddress?.emailAddress || "Unknown User"),
          avatarUrl: isGuest ? undefined : user.imageUrl,
        }
      });
    }
  }, [user, upsertMe, isGuest]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8 text-[#e8eaf2]">
          Welcome back{!isGuest && user?.firstName ? `, ${user.firstName}` : ""}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-[#e8eaf2]">
                  <Users className="w-5 h-5 text-[#8387c3]" />
                  Your Groups
                </h2>
                <Link href="/groups/new" className="text-sm text-[#8387c3] hover:text-[#b0b3d6] flex items-center gap-1 transition-colors">
                  New group <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {groupsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(58,62,108,0.25)" }} />
                  ))}
                </div>
              ) : groups?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <Link key={group.id} href={`/groups/${group.id}`}>
                      <div className="glass glass-hover rounded-2xl p-5 h-full flex flex-col cursor-pointer">
                        <h3 className="font-semibold text-lg mb-1 truncate text-[#e8eaf2]">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-[#8a8cac] line-clamp-2 mb-4 flex-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-[#8a8cac] mt-auto pt-3 border-t border-[rgba(149,155,181,0.1)]">
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
                <div className="glass rounded-2xl p-10 text-center border-dashed">
                  <Users className="w-10 h-10 text-[#8a8cac] mx-auto mb-3 opacity-60" />
                  <p className="text-[#8a8cac] mb-5">You haven't joined any groups yet.</p>
                  <Link href="/groups/new"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: "#8387c3", color: "#0a1123" }}>
                    Create a Group
                  </Link>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="glass rounded-2xl p-5">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-[#e8eaf2]">
                <Clock className="w-4 h-4 text-[#8387c3]" />
                Recent Activity
              </h2>

              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "rgba(58,62,108,0.3)" }} />
                  ))}
                </div>
              ) : activity?.length ? (
                <ul className="space-y-4">
                  {activity.slice(0, 8).map(item => (
                    <li key={item.id} className="text-sm border-b border-[rgba(149,155,181,0.08)] pb-4 last:border-0 last:pb-0">
                      <div className="flex flex-col gap-1">
                        <span>
                          <span className="font-semibold text-[#e8eaf2]">{item.actorName}</span>{' '}
                          <span className="text-[#8a8cac]">{item.detail}</span>
                        </span>
                        <div className="flex items-center justify-between text-xs text-[#8a8cac] flex-wrap gap-1">
                          {item.movieTitle && <span className="font-medium text-[#959bb5] truncate max-w-[130px]">{item.movieTitle}</span>}
                          <span className="opacity-70">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#8a8cac] text-center py-6 opacity-70">No recent activity.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
