import { WelcomeBox } from "@/components/TextBoxes/WelcomeBox";
import { SearchParams } from "@/types/search-layer";
import { SearchShowdownWrapper } from "@/views/SearchShowdownWrapper";
import { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "Search",
    description:
      "Browse all content. Filter by various criteria, search by name.",
    keywords: ["suchtext", "photography", "IMAGO Search", "Berlin", "EdTech"],
    openGraph: {
      title: "Search",
      description:
        "Browse all content. Filter by various criteria, search by name.",
      type: "website",
      locale: "en_DE",
    },
    twitter: {
      card: "summary",
      title: "Search",
      description:
        "Browse all content. Filter by various criteria, search by name.",
    },
    robots: {
      index: false, // inner search engines should not index this page
      follow: false,
    },
  };
};

export default async function SearchEnginePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <section className="flex flex-col gap-12 items-center justify-between p-24">
      <div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex">
        <WelcomeBox text="Welcome to Search Page!" />
      </div>
      <SearchShowdownWrapper searchParams={searchParams} />
    </section>
  );
}
