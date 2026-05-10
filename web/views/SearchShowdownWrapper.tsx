import { SearchFilters } from "@/components/Filters/SearchFilters";
import {
  ContentShowdown,
  ContentShowdownSkeleton,
} from "@/components/Showdowns/ContentShowdown";
import {
  filterCreditOptions,
  filterRestrictionOptions,
} from "@/lib/preprocessor";
import { SearchParams } from "@/types/search-layer";
import { Suspense } from "react";

interface Props {
  searchParams: SearchParams;
}

export const SearchShowdownWrapper = ({ searchParams }: Props) => {
  return (
    <>
      <Suspense fallback={<div>Loading search...</div>}>
        <SearchFilters
          credits={filterCreditOptions}
          restrictions={filterRestrictionOptions}
        />
      </Suspense>
      <Suspense fallback={<ContentShowdownSkeleton />}>
        <ContentShowdown searchParams={searchParams} />
      </Suspense>
    </>
  );
};
