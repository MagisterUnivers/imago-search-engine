"use client";

import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  classNames?: string;
  isDefaultStylesNotIncluded?: boolean;
}

export const Section = ({
  children,
  isDefaultStylesNotIncluded,
  classNames,
}: Props): React.ReactNode => {
  return (
    <section
      className={cn(
        !isDefaultStylesNotIncluded && "p-20 h-full w-full",
        classNames,
      )}
    >
      {children}
    </section>
  );
};
