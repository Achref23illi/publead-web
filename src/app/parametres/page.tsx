import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { ParametresPro } from "@/screens/ParametresPro";
import { ParametresGlass } from "@/screens/ParametresGlass";

export default function ParametresPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<ParametresGlass />} pro={<ParametresPro />} />
    </AppShell>
  );
}
