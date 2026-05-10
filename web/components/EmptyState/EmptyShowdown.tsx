import { Building2 } from "lucide-react";

interface Props {
  title: string;
  description: string;
}

export const EmptyShowdown = ({ title, description }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center w-full rounded-xl border border-dashed py-16 gap-3">
      <Building2 className="h-8 w-8 text-muted-foreground" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};
