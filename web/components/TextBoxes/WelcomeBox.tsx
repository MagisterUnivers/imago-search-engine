interface Props {
  text: string;
  classNames?: string;
}

export const WelcomeBox = ({ text, classNames }: Props) => {
  return (
    <div className={`flex flex-col gap-1 ${classNames || ""}`}>
      <h1 className="text-2xl font-semibold tracking-tight">{text}</h1>
    </div>
  );
};
