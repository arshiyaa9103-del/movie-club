import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMyActivity } from "@workspace/api-client-react";
import { Activity as ActivityIcon, Film, Users, MessageSquare, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityPage() {
  const { data: activity, isLoading } = useGetMyActivity();

  const getIconForType = (type: string) => {
    switch (type) {
      case "movie_added": return <Film className="w-4 h-4" />;
      case "status_updated": return <Star className="w-4 h-4" />;
      case "review_added": return <MessageSquare className="w-4 h-4" />;
      case "member_joined": return <Users className="w-4 h-4" />;
      default: return <ActivityIcon className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-[#e8eaf2]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(131,135,195,0.2)" }}>
            <ActivityIcon className="w-5 h-5 text-[#8387c3]" />
          </div>
          Activity
        </h1>

        {isLoading ? (
          <div className="space-y-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 glass rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-full" style={{ background: "rgba(58,62,108,0.5)" }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded" style={{ background: "rgba(58,62,108,0.5)" }} />
                  <div className="h-3 w-1/4 rounded" style={{ background: "rgba(58,62,108,0.5)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : activity?.length ? (
          <div className="relative border-l border-[rgba(149,155,181,0.15)] ml-4 pl-6 md:ml-6 md:pl-8 space-y-6">
            {activity.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[31px] md:-left-[41px] top-2 w-8 h-8 rounded-full flex items-center justify-center text-[#8387c3]"
                  style={{ background: "rgba(35,40,80,0.8)", border: "1px solid rgba(131,135,195,0.3)", backdropFilter: "blur(8px)" }}>
                  {getIconForType(item.type)}
                </div>

                <div className="glass glass-hover rounded-2xl p-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[15px]">
                      <span className="font-semibold text-[#e8eaf2]">{item.actorName}</span>
                      <span className="text-[#8a8cac] mx-1.5">{item.detail}</span>
                      {item.movieTitle && (
                        <span className="font-medium text-[#e8eaf2]">{item.movieTitle}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a8cac] font-medium mt-1">
                      <span className="glass-pill px-2.5 py-1 rounded-lg">{item.groupName}</span>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass rounded-2xl border-dashed">
            <ActivityIcon className="w-12 h-12 text-[#8a8cac] mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium text-[#e8eaf2]">It's quiet in here...</p>
            <p className="text-[#8a8cac] mt-2 max-w-md mx-auto">
              Activity from your groups will show up here. Add movies, write reviews, or invite friends to get started.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
