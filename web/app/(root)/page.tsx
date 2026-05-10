import { Metadata } from "next";
import Image from "next/image";
import { Building2, ChartPie, Eye } from "lucide-react";
import { Section } from "@/components/Sections/Section";
import { WelcomeCard } from "@/components/Cards/WelcomeCard";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "Home | IMAGO Search",
    description:
      "Welcome to IMAGO Search - Your comprehensive search platform for efficient media content discovery.",
    keywords: ["suchtext", "photography", "IMAGO Search", "Berlin", "EdTech"],
    openGraph: {
      title: "Home | IMAGO Search",
      description:
        "Welcome to IMAGO Search - Your comprehensive search platform for efficient media content discovery.",
      type: "website",
      locale: "en_DE",
    },
    twitter: {
      card: "summary",
      title: "Home | IMAGO Search",
      description:
        "Welcome to IMAGO Search - Your comprehensive search platform for efficient media content discovery.",
    },
  };
};

export default function Home() {
  return (
    <Section
      isDefaultStylesNotIncluded
      classNames="relative min-h-screen flex flex-col"
    >
      <div className="relative h-[60vh] w-full overflow-hidden">
        <Image
          src="/imago-skeleton.jpg"
          alt="Illustration of a note with brille, representing research"
          width={3574}
          height={2010}
          quality={100}
          priority
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-background" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="flex items-center gap-2 text-white/80 text-sm font-mono uppercase tracking-widest">
            <Building2 className="h-4 w-4" />
            <span>IMAGO Search</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight">
            IMAGO Search,
            <br />
            <span className="text-white">simplified.</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-6 -mt-8 pb-16 z-10">
        <ul className="flex items-center justify-center gap-4 w-full max-w-2xl">
          <WelcomeCard
            href="/search"
            title="Search Content"
            description="View, search and filter all content in one place."
          >
            <Eye className="h-5 w-5 text-primary" />
          </WelcomeCard>
          <WelcomeCard
            href="/analytics"
            title="Analytics"
            description="View analytics and insights about your media content."
          >
            <ChartPie className="h-5 w-5 text-primary" />
          </WelcomeCard>
        </ul>
      </div>
    </Section>
  );
}
