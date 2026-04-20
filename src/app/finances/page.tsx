import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { FinancesPro } from "@/screens/FinancesPro";
import { FinancesGlass } from "@/screens/FinancesGlass";

export default function FinancesPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<FinancesGlass />} pro={<FinancesPro />} />
    </AppShell>
  );
}
