import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { CampagnesListPro } from "@/screens/CampagnesListPro";
import { CampagnesListGlass } from "@/screens/CampagnesListGlass";

export default function CampagnesPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<CampagnesListGlass />} pro={<CampagnesListPro />} />
    </AppShell>
  );
}
