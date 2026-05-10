interface Props {
  query: {
    query: string;
    count: number;
  };
}

export const QueryElement = ({ query }: Props) => {
  return (
    <li className="group relative flex items-center justify-between w-full rounded-lg border border-border bg-background px-5 py-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 hover:bg-accent/3">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-medium group-hover:text-primary transition-colors duration-300 truncate max-w-[400px]">
            {query.query}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          <p className="font-medium group-hover:text-primary transition-colors duration-300 truncate max-w-[300px]">
            Count: {query.count}
          </p>
        </div>
      </div>
    </li>
  );
};
