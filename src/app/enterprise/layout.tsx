"use client";

/**
 * Enterprise portal layout — auth-gated, wrapped in the EnterpriseShell.
 * Separate from AppShell so the advertiser side can evolve independently.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EnterpriseShell } from "@/components/EnterpriseShell";
import { isAuthed } from "@/lib/auth";

export default function EnterpriseLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthed()) {
      router.replace("/login");
    }
  }, [router]);

  if (!mounted) return null;

  return <EnterpriseShell>{children}</EnterpriseShell>;
}
