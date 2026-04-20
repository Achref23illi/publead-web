import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { RapportsPro } from "@/screens/RapportsPro";
import { RapportsGlass } from "@/screens/RapportsGlass";

export default function RapportsPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<RapportsGlass />} pro={<RapportsPro />} />
    </AppShell>
  );
}
