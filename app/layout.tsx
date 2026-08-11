import type { Metadata } from "next";
import "./globals.css";

const title = "Южно-Сахалинск — от данных к городским решениям";
const description = "Интерактивная модель здоровья, устойчивости и городской среды Южно-Сахалинска.";

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title, description, images: [{ url: "/og.png", width: 1672, height: 941 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
