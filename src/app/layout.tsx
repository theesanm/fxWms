
import { GeistSans, GeistMono } from 'geist/font';
import "./globals.css";
import { Auth } from "@/components/auth";
import { ClientLayout } from "@/components/layout/client-layout";

export const metadata = {
  title: "Admin Portal",
  description: "Administrative interface",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Auth>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Auth>
      </body>
    </html>
  );
}







