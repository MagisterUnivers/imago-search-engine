import { QueryElement } from "./QueryElement";
import { EmptyShowdown } from "@/components/EmptyState/EmptyShowdown";
import { AnalyticsSummary } from "@/lib/analytics";

interface Props {
  totalQueries: AnalyticsSummary["topQueries"];
}

export const QueryList = ({ totalQueries }: Props) => {
  if (totalQueries.length === 0) {
    return (
      <EmptyShowdown
        title="No queries Yet"
        description="We dont have any queries yet"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2 w-full">
      {totalQueries.map((query) => (
        <QueryElement key={query.query} query={query} />
      ))}
    </ul>
  );
};
