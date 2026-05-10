import { User, Calculator, RotateCcw } from "lucide-react";
import Image from "next/image";
import { getAnalytics } from "@/lib/analytics";
import { ActionButton } from "@/components/Buttons/ActionButton";
import { QueryList } from "@/components/Lists/QueryList/QueryList";

export const AnalyticsShowdown = () => {
  const { totalSearches, avgDurationMs, topQueries } = getAnalytics();

  return (
    <div className="w-full flex flex-col gap-0 rounded-xl border bg-card overflow-hidden">
      <div className="relative h-64 w-full">
        <Image
          src="/analytics-skeleton.jpg"
          alt="Analytics"
          width={2426}
          height={1728}
          quality={100}
          priority
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute bottom-4 left-5 flex flex-col gap-1">
          <h1 className="text-white text-2xl font-semibold">Analytics Page</h1>
        </div>

        <div className="absolute top-4 right-4">
          <ActionButton
            variant="outline"
            size="sm"
            title="Refresh Analytics Data"
            classname="bg-white/90 backdrop-blur-sm hover:bg-white"
            isNeedRefresh
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </ActionButton>
        </div>
      </div>

      <div
        className={`h-1.5 w-full ${
          totalSearches < 5 ? "bg-blue-500" : "bg-emerald-500"
        }`}
      />

      <div className="p-6 grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {totalSearches === 1 ? "Total Search" : "Total Searches"}
            </span>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{totalSearches}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Average Query Duration
            </span>
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{avgDurationMs} ms</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <QueryList totalQueries={topQueries} />
        </div>
      </div>
    </div>
  );
};
