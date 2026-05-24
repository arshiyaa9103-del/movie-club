import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateGroup } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Film } from "lucide-react";

export default function NewGroup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createGroup = useCreateGroup();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGroup.mutate(
      { data: { name, description: description || null } },
      {
        onSuccess: (group) => {
          toast({
            title: "Group created",
            description: "Your new film club is ready.",
          });
          setLocation(`/groups/${group.id}`);
        },
        onError: (err) => {
          toast({
            title: "Error creating group",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            Start a Film Club
          </h1>
          <p className="text-muted-foreground mt-2">Create a private space to share and track movies with friends.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Group Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Watchers, Sci-Fi Sunday"
              className="w-full bg-input border border-neutral rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={createGroup.isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of movies do you watch?"
              className="w-full bg-input border border-neutral rounded-md px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-y"
              disabled={createGroup.isPending}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={createGroup.isPending || !name.trim()}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}