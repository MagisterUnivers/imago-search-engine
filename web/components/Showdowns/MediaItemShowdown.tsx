import Image from "next/image";
import { Users, Calendar, Archive, Tag } from "lucide-react";
import { ProcessedMediaItem } from "@/types/search-layer";
import { BildNummerBadge } from "@/components/Badges/BildNummerBadge";

interface Props {
  item: ProcessedMediaItem;
}

export const MediaItemShowdown = ({ item }: Props) => {
  const imageUrl = `https://picsum.photos/seed/${item.id}/800/600`;

  return (
    <div className="w-full flex flex-col gap-0 rounded-xl border bg-card overflow-hidden">
      <div
        className={`h-1.5 w-full ${item.archiveRef ? "bg-blue-500" : "bg-emerald-500"}`}
      />

      <div className="relative h-72 w-full">
        <Image
          src={imageUrl}
          alt={item.suchtext}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5">
          <BildNummerBadge
            bildNummerStyle={item.bildnummer}
            isRefered={!!item.archiveRef}
          />
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        <h2 className="text-xl font-semibold leading-snug">
          {item.suchtextNorm}
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Photographer
              </span>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{item.fotografen}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Date
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{item.datumRaw}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {item.archiveRef && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Archive Ref
                </span>
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {item.archiveRef}
                  </span>
                </div>
              </div>
            )}

            {item.restrictions.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Restrictions
                </span>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium break-all">
                    {item.restrictions[0]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
