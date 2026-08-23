import type { Metadata } from "next";
import { Great_Vibes, Outfit, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Desy Nails — Desiree Tropini",
    template: "%s · Desy Nails",
  },
  description:
    "Studio di unghie di Desiree Tropini. Precisione, eleganza e trattamenti personalizzati. Prenota un appuntamento o scopri i servizi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${outfit.variable} ${playfair.variable} ${script.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ThemeProvider>
          <CartProvider>
            <a
              href="#contenuto"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-gold focus:px-3 focus:py-2"
            >
              Salta al contenuto
            </a>
            <Header />
            <main id="contenuto" className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
