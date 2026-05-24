import { AppLayout } from "@/components/layout/AppLayout";
import { useGetMyActivity } from "@workspace/api-client-react";
import { Activity as ActivityIcon, Film, Users, MessageSquare, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

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
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ActivityIcon className="w-8 h-8 text-primary" />
          Network Activity
        </h1>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border border-border bg-card rounded-xl animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activity?.length ? (
          <div className="relative border-l border-border/50 ml-4 pl-6 md:ml-6 md:pl-8 space-y-8">
            {activity.map((item) => (
              <div key={item.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] md:-left-[41px] top-1 w-8 h-8 rounded-full bg-card border-2 border-primary flex items-center justify-center text-primary shadow-sm">
                  {getIconForType(item.type)}
                </div>

                <div className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[15px]">
                      <span className="font-semibold text-foreground">{item.actorName}</span>
                      <span className="text-muted-foreground mx-1.5">{item.detail}</span>
                      {item.movieTitle && (
                        <span className="font-medium text-foreground">{item.movieTitle}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                      <span className="bg-muted px-2 py-1 rounded-md">{item.groupName}</span>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border border-dashed rounded-xl">
            <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">It's quiet in here...</p>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Activity from your groups will show up here. Add movies, write reviews, or invite friends to get started.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}