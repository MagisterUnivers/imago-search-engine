"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  title: string;
  variant?: "outline" | "default" | "destructive";
  size?: "sm" | "lg";
  classname?: string;
  disabled?: boolean;
  isNeedRefresh?: boolean;
  onClickF?: () => void;
}

export const ActionButton = ({
  children,
  disabled,
  variant,
  size,
  classname,
  title,
  onClickF,
  isNeedRefresh,
}: Props) => {
  const router = useRouter();

  const handleRefresh = () => {
    onClickF?.();
    router.refresh();
  };

  return (
    <Button
      variant={variant}
      size={size}
      type="button"
      disabled={disabled}
      title={title}
      onClick={isNeedRefresh ? handleRefresh : onClickF}
      className={classname}
    >
      {children}
    </Button>
  );
};
