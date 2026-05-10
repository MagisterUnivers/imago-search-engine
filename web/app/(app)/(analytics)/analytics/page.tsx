import { Section } from "@/components/Sections/Section";
import { AnalyticsShowdown } from "@/components/Showdowns/AnalyticsShowdown";
import { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "Analytics",
    description:
      "View detailed analytics and insights about your service track.",
    keywords: [
      "analytics",
      "service analytics",
      "IMAGO",
      "statistics",
      "insights",
    ],
    openGraph: {
      title: "Analytics",
      description:
        "View detailed analytics and insights about your service track.",
      type: "website",
      locale: "en_DE",
    },
    twitter: {
      card: "summary",
      title: "Analytics",
      description:
        "View detailed analytics and insights about your service track",
    },
    robots: {
      index: false,
      follow: false,
    },
  };
};

export default function AnalyticsPage() {
  return (
    <Section classNames="flex gap-12 flex-col items-center justify-between p-24">
      <AnalyticsShowdown />
    </Section>
  );
}
