import { Users, ChevronRight } from "lucide-react";
import { ProcessedMediaItem } from "@/types/search-layer";
import { BildNummerBadge } from "@/components/Badges/BildNummerBadge";

interface Props {
  contentElement: ProcessedMediaItem;
}

export const ContentCard = ({ contentElement }: Props) => {
  return (
    <div className="group block">
      <div className="relative rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div
          className={`h-1.5 w-full ${
            contentElement.archiveRef ? "bg-blue-500" : "bg-emerald-500"
          }`}
        />

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <BildNummerBadge
                  bildNummerStyle={contentElement.bildnummer}
                  isRefered={contentElement.archiveRef ? true : false}
                />
              </div>
              <h3 className="font-semibold text-base leading-tight mt-1 max-w-[200px] truncate">
                {contentElement.suchtext}
              </h3>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>

          <div className="flex items-center gap-2 pt-1 border-t">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <span className="truncate">{contentElement.fotografen}</span>
              <span>·</span>
              <span className="truncate">{contentElement.datum}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
