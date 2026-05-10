interface Props {
  bildNummerStyle: string;
  isRefered: boolean;
}

export const BildNummerBadge = ({ bildNummerStyle, isRefered }: Props) => {
  return (
    <span
      className={`text-sm font-semibold w-fit px-2 py-0.5 rounded-full ${
        isRefered
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      }`}
    >
      {bildNummerStyle}
    </span>
  );
};
