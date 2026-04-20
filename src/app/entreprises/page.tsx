import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { EntreprisesPro } from "@/screens/EntreprisesPro";
import { EntreprisesGlass } from "@/screens/EntreprisesGlass";

export default function EntreprisesPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<EntreprisesGlass />} pro={<EntreprisesPro />} />
    </AppShell>
  );
}
