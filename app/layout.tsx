import type { Metadata } from "next";
import "./globals.css";

const title = "Южно-Сахалинск — от данных о здоровье к проектам города";
const description = "Интерактивная презентация портфеля городских проектов для Южно-Сахалинска.";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title, description, type: "website", images: [{ url: "/og.png", width: 1536, height: 1024 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
