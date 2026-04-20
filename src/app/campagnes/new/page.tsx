import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { NouvelleCampagnePro } from "@/screens/NouvelleCampagnePro";
import { NouvelleCampagneGlass } from "@/screens/NouvelleCampagneGlass";

export default function NouvelleCampagnePage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<NouvelleCampagneGlass />} pro={<NouvelleCampagnePro />} />
    </AppShell>
  );
}
