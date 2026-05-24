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
          toast({ title: "Group created", description: "Your new film club is ready." });
          setLocation(`/groups/${group.id}`);
        },
        onError: () => {
          toast({ title: "Error creating group", description: "Please try again later.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-[#e8eaf2]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(131,135,195,0.2)" }}>
              <Film className="w-5 h-5 text-[#8387c3]" />
            </div>
            Start a Film Club
          </h1>
          <p className="text-[#8a8cac] mt-2">Create a private space to share and track movies with friends.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-dense rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-[#e8eaf2]">Group Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend Watchers, Sci-Fi Sunday"
              className="w-full glass-input rounded-xl px-4 py-3 text-[#e8eaf2] text-sm"
              required
              disabled={createGroup.isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-[#e8eaf2]">Description <span className="text-[#8a8cac] font-normal">(optional)</span></label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of movies do you watch?"
              className="w-full glass-input rounded-xl px-4 py-3 text-[#e8eaf2] text-sm min-h-[120px] resize-y"
              disabled={createGroup.isPending}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createGroup.isPending || !name.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#8387c3", color: "#0a1123" }}
            >
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
