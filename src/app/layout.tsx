import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/providers/SessionProvider";
import ThemeProvider from "@/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carwashpro.com.co"),
  title: {
    default: "CarWashPro — Software de Gestión para Autolavados en Colombia",
    template: "%s | CarWashPro",
  },
  description:
    "Software todo en uno para autolavados en Colombia. Gestiona clientes, vehículos, órdenes de servicio, equipo y reportes financieros desde un solo lugar. Sin papel ni Excel.",
  keywords: [
    "software para autolavado Colombia",
    "sistema de gestión lavadero de autos",
    "programa para lavadero de carros",
    "aplicación autolavado Colombia",
    "gestión órdenes autolavado",
    "software lavadero Colombia",
    "sistema autolavado",
    "control lavadero de autos",
    "administración autolavado",
    "plataforma lavadero Colombia",
  ],
  authors: [{ name: "CarWashPro" }],
  creator: "CarWashPro",
  publisher: "CarWashPro",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "CarWashPro",
    title: "CarWashPro — Software de Gestión para Autolavados en Colombia",
    description:
      "Gestiona clientes, vehículos, órdenes y reportes de tu autolavado desde un solo sistema. Sin papel. Sin Excel. Sin complicaciones.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CarWashPro — Software para Autolavados Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarWashPro — Software de Gestión para Autolavados",
    description:
      "Gestiona tu autolavado: clientes, órdenes, equipo y reportes en un solo lugar.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
