import type { Metadata } from "next";
import { Header } from "@/components/Layout/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: {
    default: "IMAGO Search",
    template: "%s | IMAGO",
  },
  description:
    "Powerful search and analytics platform for media management. Browse, filter, and analyze content with advanced search capabilities.",
  keywords: [
    "search",
    "media search",
    "IMAGO",
    "analytics",
    "media management",
  ],
  authors: [{ name: "Andrii Shaposhnikov" }],
  creator: "Andrii Shaposhnikov",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_DE",
    siteName: "IMAGO Search",
    title: "IMAGO Search",
    description: "Powerful search and analytics platform for media management.",
  },
  twitter: {
    card: "summary",
    title: "IMAGO Search",
    description: "Powerful search and analytics platform for media management.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <Header />
      </header>
      <main>{children}</main>
      <ToastContainer position="top-right" />
    </>
  );
}
