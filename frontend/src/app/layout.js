import { Inter, Epilogue } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });
const epilogue = Epilogue({ subsets: ["latin"] });

export const metadata = {
  title: "VerifiAI - Verifiable AI Data Marketplace",
  description: "VerifiAI is the first verifiable AI training data marketplace on Filecoin with cryptographic proofs and USDFC payments.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={epilogue.className}>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
