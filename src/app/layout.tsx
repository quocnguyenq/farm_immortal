import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const viet = Be_Vietnam_Pro({
  variable: "--font-viet",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nông Trại Tiên Duyên",
  description: "Nông trại vui vẻ, tích trữ sản lượng, mở đường tu tiên",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${viet.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
