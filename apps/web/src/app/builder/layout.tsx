import { Bricolage_Grotesque, DM_Serif_Display, IBM_Plex_Sans, Manrope } from "next/font/google";

// Form fonts for the builder's Design > Font choices. Loaded here so other routes don't pay for them.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" });
const plex = IBM_Plex_Sans({ variable: "--font-plex", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export default function BuilderLayout({ children }: LayoutProps<"/builder">) {
  return <div className={`${manrope.variable} ${dmSerif.variable} ${plex.variable} ${bricolage.variable} contents`}>{children}</div>;
}
