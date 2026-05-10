import { ContentCard } from "@/components/Cards/ContentCard";
import { SearchParams } from "@/types/search-layer";
import { EmptyShowdown } from "@/components/EmptyState/EmptyShowdown";
import { searchMediaAction } from "@/app/actions";
import { ContentShowdownPagination } from "@/components/Paginations/ContentShowdownPagination";

interface Props {
  searchParams: SearchParams;
}

const SkeletonCard = () => (
  <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
    <div className="h-1.5 w-full bg-muted" />
    <div className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-12 rounded-full bg-muted" />
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-14 rounded-lg bg-muted" />
        <div className="h-14 rounded-lg bg-muted" />
      </div>
      <div className="h-4 w-full rounded bg-muted" />
    </div>
  </div>
);

export const ContentShowdown = async ({ searchParams }: Props) => {
  const results = await searchMediaAction(searchParams);
  const totalItems = results.total;
  const currentPage = results.page;
  const totalPages = results.totalPages;

  if (results.items.length === 0) {
    return (
      <EmptyShowdown
        title="No content yet"
        description="Wait till we add some content or upload your own content for a people to see."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <h2>
        {totalItems} Result{totalItems !== 1 ? "s" : ""}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {results.items.map((item) => (
          <ContentCard key={item.id} contentElement={item} />
        ))}
        <ContentShowdownPagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
};

export const ContentShowdownSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
    {Array.from({ length: 8 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
