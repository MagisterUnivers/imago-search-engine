"use client";

import { ActionButton } from "@/components/Buttons/ActionButton";
import { RotateCcw } from "lucide-react";

export default function SearchError() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-muted-foreground">
        Something went wrong loading results.
      </p>
      <ActionButton
        variant="destructive"
        size="sm"
        title="Refresh Search Page"
        isNeedRefresh
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Try Again
      </ActionButton>
    </div>
  );
}
