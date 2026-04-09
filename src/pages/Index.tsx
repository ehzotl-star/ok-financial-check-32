import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CheckItem {
  id: string;
  category: string;
  title: string;
  checked: boolean;
  memo: string;
}

const initialItems: CheckItem[] = [
  { id: "1", category: "월간 점검", title: "고객정보 접근권한 확인", checked: false, memo: "" },
  { id: "2", category: "월간 점검", title: "비밀번호 변경 여부", checked: false, memo: "" },
  { id: "3", category: "월간 점검", title: "문서 보관 상태", checked: false, memo: "" },
  { id: "4", category: "분기 점검", title: "시스템 로그 점검", checked: false, memo: "" },
  { id: "5", category: "분기 점검", title: "외부감사 자료 준비", checked: false, memo: "" },
  { id: "6", category: "분기 점검", title: "규정 변경사항 반영", checked: false, memo: "" },
];

type FilterType = "전체" | "완료" | "미완료";

const Index = () => {
  const [items, setItems] = useState<CheckItem[]>(initialItems);
  const [filter, setFilter] = useState<FilterType>("전체");

  const completedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleCheck = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const updateMemo = (id: string, memo: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, memo } : item)));
  };

  const filtered = items.filter((item) => {
    if (filter === "완료") return item.checked;
    if (filter === "미완료") return !item.checked;
    return true;
  });

  const categories = Array.from(new Set(filtered.map((i) => i.category)));
  const filters: FilterType[] = ["전체", "완료", "미완료"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">OK금융 업무 점검</h1>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">진행률</span>
              <span className="text-sm font-semibold text-accent">
                {completedCount} / {totalCount} 완료
              </span>
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-muted [&>div]:bg-accent" />
          </div>

          {/* Filters */}
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

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-8">
        {categories.map((cat) => (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h2>
            </div>
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
                        onCheckedChange={() => toggleCheck(item.id)}
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
                        </div>
                        <Textarea
                          placeholder="메모를 입력하세요..."
                          value={item.memo}
                          onChange={(e) => updateMemo(item.id, e.target.value)}
                          className="mt-2 min-h-[60px] resize-none border-border bg-muted/50 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
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
