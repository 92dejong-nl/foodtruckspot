import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FoodTruckSpot - Vervang onderbuikgevoel door feiten",
  description: "FoodTruckSpot analyseert je verkoopdata en koppelt dit aan het weer. Krijg doorlopend inzicht in de prestaties van je foodtruck. €19/maand, altijd opzegbaar.",
  keywords: [
    "food truck analyse tool",
    "food truck nederland",
    "food truck data analyse",
    "food truck weer impact",
    "food truck locatie analyse",
    "food truck trends",
    "mobiele catering analyse",
    "food truck abonnement"
  ],
  authors: [{ name: "TruckSpot" }],
  creator: "TruckSpot",
  publisher: "TruckSpot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://foodtruckspot.nl"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FoodTruckSpot - Vervang onderbuikgevoel door feiten",
    description: "FoodTruckSpot analyseert je verkoopdata en koppelt dit aan het weer. Krijg doorlopend inzicht in de prestaties van je foodtruck. €19/maand, altijd opzegbaar.",
    url: "https://foodtruckspot.nl",
    siteName: "FoodTruckSpot",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FoodTruckSpot - Continue data-analyse voor Nederlandse foodtrucks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodTruckSpot - Vervang onderbuikgevoel door feiten",
    description: "FoodTruckSpot analyseert je verkoopdata en koppelt dit aan het weer. €19/maand, altijd opzegbaar.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
