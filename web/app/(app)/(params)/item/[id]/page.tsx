import { Section } from "@/components/Sections/Section";
import { MediaItemShowdown } from "@/components/Showdowns/MediaItemShowdown";
import { processedItems } from "@/lib/preprocessor";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { id: string };
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const numId = parseInt(params.id, 10);
  const item = processedItems.find((i) => i.id === numId);

  if (!item) {
    return { title: "Item Not Found" };
  }

  const imageUrl = `https://picsum.photos/seed/${params.id}/200/300`;
  const title = item.id.toString();
  const description = `${item.fotografen} · ${item.datumRaw}`;

  return {
    title,
    description,
    keywords: item.tokens.slice(0, 10),
    openGraph: {
      title,
      description,
      type: "article",
      locale: "en_DE",
      images: [{ url: imageUrl, width: 200, height: 300, alt: item.suchtext }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
};

export default function MediaItemPage({ params }: Props) {
  const numId = parseInt(params.id, 10);
  const item = processedItems.find((i) => i.id === numId);

  if (!item) {
    notFound();
  }

  return (
    <Section classNames="flex gap-12 flex-col items-center justify-between p-24">
      <MediaItemShowdown item={item} />
    </Section>
  );
}
