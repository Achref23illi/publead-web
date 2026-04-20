import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { ChauffeursPro } from "@/screens/ChauffeursPro";
import { ChauffeursGlass } from "@/screens/ChauffeursGlass";

export default function ChauffeursPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<ChauffeursGlass />} pro={<ChauffeursPro />} />
    </AppShell>
  );
}
