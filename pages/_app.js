import { ClerkProvider } from "@clerk/nextjs";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { Geist_Mono } from "next/font/google";
import Head from "next/head";
import CatCanvas from "@/components/cat/cat-canvas";
import InfoCard from "@/components/info-card";
import { Nav, PageTransition } from "@/components/navigation";
import "@/styles/globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

config.autoAddCss = false;

const clerkAppearance = {
  variables: {
    colorPrimary: "#e98a3c",
    colorBackground: "#25272d",
    colorForeground: "#e3ddd4",
    colorMutedForeground: "#8a847c",
    colorNeutral: "#e3ddd4",
    colorInput: "#1c1e23",
    colorInputForeground: "#e3ddd4",
    colorBorder: "rgb(255 255 255 / 0.08)",
    fontFamily: geistMono.style.fontFamily,
    borderRadius: "8px",
  },
};

export default function App({ Component, pageProps }) {
  return (
    <ClerkProvider
      {...pageProps}
      appearance={clerkAppearance}
      afterSignOutUrl="/d/login"
    >
      <div className={`${geistMono.variable} app`}>
        <Head>
          {/* viewport-fit=cover lets env(safe-area-inset-*) reach the notch / home-bar edges */}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <meta name="theme-color" content="#1c1e23" />
        </Head>
        <PageTransition>
          <Component {...pageProps} />
        </PageTransition>
        {/* header, card and cat sit outside the transition: they stay sharp while pages blur,
          and keep their z-index order (header 2 < cat 3 < card 4) whatever the wrapper is doing */}
        <Nav />
        <InfoCard />
        <CatCanvas />
      </div>
    </ClerkProvider>
  );
}
