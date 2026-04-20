import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { UiStateProvider } from "@/contexts/UiStateContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Publeader — Administration",
  description: "Tableau de bord Publeader pour la gestion des campagnes, chauffeurs et bornes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <UiStateProvider>{children}</UiStateProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
