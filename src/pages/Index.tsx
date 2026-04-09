import { useState, useCallback } from "react";
import { CheckCircle2, ChevronDown, Circle, ClipboardCheck, Filter, Plus, Trash2, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CheckItem {
  id: string;
  category: string;
  title: string;
  checked: boolean;
  memo: string;
}

type FilterType = "전체" | "완료" | "미완료";

const CATEGORIES = ["월간 점검", "분기 점검"];

const fetchItems = async (): Promise<CheckItem[]> => {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("id, title, category, checked, memo")
    .order("created_at");
  if (error) throw error;
  return data;
};

const Index = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("전체");
  const [memoTimers, setMemoTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["checklist_items"],
    queryFn: fetchItems,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CheckItem> }) => {
      const { error } = await supabase.from("checklist_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["checklist_items"] });
      const prev = queryClient.getQueryData<CheckItem[]>(["checklist_items"]);
      queryClient.setQueryData<CheckItem[]>(["checklist_items"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...updates } : item)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["checklist_items"], context.prev);
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string; category: string }) => {
      const { error } = await supabase.from("checklist_items").insert({ title, category });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_items"] });
      setNewTitle("");
      setShowAddForm(false);
      toast.success("항목이 추가되었습니다");
    },
    onError: () => toast.error("추가에 실패했습니다"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["checklist_items"] });
      const prev = queryClient.getQueryData<CheckItem[]>(["checklist_items"]);
      queryClient.setQueryData<CheckItem[]>(["checklist_items"], (old) =>
        old?.filter((item) => item.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["checklist_items"], context.prev);
      toast.error("삭제에 실패했습니다");
    },
    onSuccess: () => toast.success("항목이 삭제되었습니다"),
  });

  const toggleCheck = (id: string, currentChecked: boolean) => {
    updateMutation.mutate({ id, updates: { checked: !currentChecked } });
  };

  const handleMemoChange = useCallback(
    (id: string, memo: string) => {
      queryClient.setQueryData<CheckItem[]>(["checklist_items"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, memo } : item)) ?? []
      );
      setMemoTimers((prev) => {
        if (prev[id]) clearTimeout(prev[id]);
        const timer = setTimeout(() => {
          updateMutation.mutate({ id, updates: { memo } });
        }, 500);
        return { ...prev, [id]: timer };
      });
    },
    [queryClient, updateMutation]
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMutation.mutate({ title: newTitle.trim(), category: newCategory });
  };

  const completedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const filtered = items.filter((item) => {
    if (filter === "완료") return item.checked;
    if (filter === "미완료") return !item.checked;
    return true;
  });

  const categories = Array.from(new Set(filtered.map((i) => i.category)));
  const filters: FilterType[] = ["전체", "완료", "미완료"];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">OK금융 업무 점검</h1>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="ml-auto"
              variant={showAddForm ? "secondary" : "default"}
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">{showAddForm ? "취소" : "항목 추가"}</span>
            </Button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <Input
                placeholder="점검 항목명을 입력하세요"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="bg-card border-border"
              />
              <div className="flex gap-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-card border-border flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} disabled={!newTitle.trim() || addMutation.isPending}>
                  저장
                </Button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">진행률</span>
              <span className="text-sm font-semibold text-accent">
                {completedCount} / {totalCount} 완료
              </span>
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-muted [&>div]:bg-accent" />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        {categories.map((cat) => (
          <Collapsible key={cat} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 mb-3 w-full group cursor-pointer">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
              <span className="text-xs text-muted-foreground ml-1">
                ({filtered.filter((i) => i.category === cat && i.checked).length}/{filtered.filter((i) => i.category === cat).length})
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto transition-transform group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3">
                {filtered
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border bg-card p-4 transition-all ${
                        item.checked ? "border-accent/30 bg-accent/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleCheck(item.id, item.checked)}
                          className="mt-0.5 h-5 w-5 rounded-md border-muted-foreground data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium transition-colors ${
                                item.checked ? "text-muted-foreground line-through" : "text-foreground"
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.checked && (
                              <Badge variant="secondary" className="bg-accent/15 text-accent text-xs border-0">
                                완료
                              </Badge>
                            )}
                            <button
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="ml-auto p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <Textarea
                            placeholder="메모를 입력하세요..."
                            value={item.memo}
                            onChange={(e) => handleMemoChange(item.id, e.target.value)}
                            className="mt-2 min-h-[60px] resize-none border-border bg-muted/50 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {filter === "완료" ? (
              <>
                <Circle className="h-12 w-12 mb-3 opacity-30" />
                <p>완료된 항목이 없습니다</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                <p>모든 항목을 완료했습니다! 🎉</p>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
