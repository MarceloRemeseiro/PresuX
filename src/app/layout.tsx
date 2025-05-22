import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Navbar } from "@/components/layout/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PresuX - Gestión de Presupuestos y Facturas",
  description: "Sistema de gestión de presupuestos y facturas para empresas",
  authors: [{ name: "PresuX Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
              {children}
            </main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
