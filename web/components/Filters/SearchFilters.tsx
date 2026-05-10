"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Search, X, ChevronDown, CalendarIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { SortOrder } from "@/types/search-layer";
import { FilterOption } from "@/lib/preprocessor";
import { toast } from "react-toastify";

const MOCK_CREDITS = [
  {
    label: "IMAGO / United Archives International",
    value: "IMAGO / United Archives International",
  },
  { label: "IMAGO / teutopress", value: "IMAGO / teutopress" },
  { label: "IMAGO / ZUMA Press", value: "IMAGO / ZUMA Press" },
  { label: "IMAGO / ABACAPRESS", value: "IMAGO / ABACAPRESS" },
  { label: "IMAGO / Sportimage", value: "IMAGO / Sportimage" },
];

// Extracted by preprocessor via /\b[A-Z]{2,}(?:x[A-Z]{2,})+\b/g
const MOCK_RESTRICTIONS = [
  {
    label: "PUBLICATIONxINxGERxSUIxAUTxONLY",
    value: "PUBLICATIONxINxGERxSUIxAUTxONLY",
  },
  { label: "NOxMEXxEUROPE", value: "NOxMEXxEUROPE" },
  { label: "NOxMEXxARG", value: "NOxMEXxARG" },
  { label: "DISTRIBUTIONxEUROPE", value: "DISTRIBUTIONxEUROPE" },
  { label: "EDITORIALxUSExONLY", value: "EDITORIALxUSExONLY" },
];

export interface SearchFiltersState {
  query: string;
  credit: string; // fotografen exact match; "" = all
  dateFrom: string; // ISO yyyy-mm-dd; "" = no lower bound
  dateTo: string; // ISO yyyy-mm-dd; "" = no upper bound
  restrictions: string[]; // item must have ALL selected restrictions
  sortOrder: "asc" | "desc" | "none";
}

interface Props {
  /** Fired immediately on filter/sort change; debounced 2s on query change */
  /** Pass real values from preprocessed data */
  credits: readonly FilterOption[];
  restrictions: readonly FilterOption[];
}

const DEFAULT_STATE: SearchFiltersState = {
  query: "",
  credit: "",
  dateFrom: "",
  dateTo: "",
  restrictions: [],
  sortOrder: "none",
};

export const SearchFilters = ({
  credits = MOCK_CREDITS,
  restrictions = MOCK_RESTRICTIONS,
}: Props) => {
  // Separate local value so the input stays responsive while debounce waits
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<SearchFiltersState>({
    query: searchParams.get("q") ?? "",
    credit: searchParams.get("credit") ?? "",
    dateFrom: searchParams.get("from") ?? "",
    dateTo: searchParams.get("to") ?? "",
    sortOrder: (searchParams.get("sort") ?? "none") as SortOrder,
    restrictions: searchParams.get("r")?.split(",").filter(Boolean) ?? [],
  });

  // Immediate — used by all selects, date pickers, restrictions, sort
  const pushToURL = useCallback(
    (partial: Partial<SearchFiltersState>) => {
      const next = { ...filters, ...partial };
      setFilters(next); // local state for UI

      const params = new URLSearchParams(searchParams.toString());

      // Write or Delete each param, to keep URL clean (no empty params)
      next.query ? params.set("q", next.query) : params.delete("q");
      next.credit ? params.set("credit", next.credit) : params.delete("credit");
      next.dateFrom ? params.set("from", next.dateFrom) : params.delete("from");
      next.dateTo ? params.set("to", next.dateTo) : params.delete("to");
      next.sortOrder !== "none"
        ? params.set("sort", next.sortOrder)
        : params.delete("sort");
      next.restrictions.length
        ? params.set("r", next.restrictions.join(","))
        : params.delete("r");

      params.set("page", "1"); // drop pagination with any filter change
      params.set("pageSize", "20"); // reset pageSize to default on any filter change

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [filters, router, searchParams],
  );

  // Debounced 2000ms — only for the free-text search input.
  // useDebouncedCallback resets the timer on every new keystroke automatically.
  const debouncedQuery = useDebouncedCallback((value: string) => {
    pushToURL({ query: value });
    toast.success("Search query updated", { autoClose: 1000 });
  }, 2000);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedQuery(e.target.value);
  };

  const hasActiveFilters =
    !!filters.credit ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    filters.restrictions.length > 0 ||
    !!filters.query;

  const resetAll = () => {
    debouncedQuery.cancel(); // drop any pending debounced call
    setInputValue("");
    setFilters(DEFAULT_STATE);

    router.replace(window.location.pathname, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search — debounced 2s */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="media-search"
            placeholder="Search keyword, author, or ID…"
            value={inputValue}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Search media items"
            autoComplete="off"
          />
        </div>

        {/* Credit (fotografen) — immediate */}
        <Select
          value={filters.credit || "__all__"}
          onValueChange={(v) => pushToURL({ credit: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-52" aria-label="Filter by credit">
            <SelectValue placeholder="All credits" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All credits</SelectItem>
            {credits.map((c) => (
              <SelectItem key={c.label} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range — immediate */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-48 justify-between font-normal text-muted-foreground"
              aria-label="Filter by date range"
            >
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {filters.dateFrom || filters.dateTo
                  ? `${filters.dateFrom || "…"} → ${filters.dateTo || "…"}`
                  : "Date range"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="date-from"
                  className="text-xs text-muted-foreground"
                >
                  From
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) => pushToURL({ dateFrom: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="date-to"
                  className="text-xs text-muted-foreground"
                >
                  To
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => pushToURL({ dateTo: e.target.value })}
                />
              </div>
              {(filters.dateFrom || filters.dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start h-7 text-xs px-2"
                  onClick={() => pushToURL({ dateFrom: "", dateTo: "" })}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Restrictions — multi Combobox with chips — immediate */}
        <Combobox
          items={restrictions}
          multiple
          value={filters.restrictions}
          onValueChange={(v) => pushToURL({ restrictions: v })}
        >
          <ComboboxChips
            className="min-w-48 max-w-80"
            aria-label="Filter by restrictions"
          >
            <ComboboxValue>
              {filters.restrictions.map((r) => (
                <ComboboxChip key={r} className="font-mono text-xs">
                  {r}
                </ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput placeholder="Restrictions…" />
          </ComboboxChips>
          <ComboboxContent>
            <ComboboxEmpty>No restrictions found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem
                  key={item.label}
                  value={item.value}
                  className="font-mono text-xs"
                >
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {/* Sort by date — immediate */}
        <Select
          value={filters.sortOrder}
          onValueChange={(v) =>
            pushToURL({ sortOrder: v as SearchFiltersState["sortOrder"] })
          }
        >
          <SelectTrigger className="w-44" aria-label="Sort by date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sort: Default</SelectItem>
            <SelectItem value="asc">Date: Oldest first</SelectItem>
            <SelectItem value="desc">Date: Newest first</SelectItem>
          </SelectContent>
        </Select>

        {/* Results reset */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAll}
              className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1"
              aria-label="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
