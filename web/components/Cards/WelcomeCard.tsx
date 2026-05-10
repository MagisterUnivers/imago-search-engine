import Link from "next/link";

interface Props {
  children: React.ReactNode;
  href: string;
  title: string;
  description: string;
}

export const WelcomeCard = ({ children, href, title, description }: Props) => {
  return (
    <li className="group flex flex-col gap-3 rounded-xl border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <Link href={href} className="w-full h-full p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-2">{children}</div>
          <span className="text-xs text-muted-foreground font-mono">
            {href}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </Link>
    </li>
  );
};
