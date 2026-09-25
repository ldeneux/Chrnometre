import "./globals.css";

export const metadata = {
  title: "Chrono Natation - Mode Hors-Ligne",
  description: "Prise de temps de natation avec calcul automatique de longueurs et export Excel",
  manifest: "/manifest.json",
  themeColor: "#0284c7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/app_icon.png" type="image/png" sizes="32x32"/>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
