import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { DashboardPro } from "@/screens/DashboardPro";
import { DashboardGlass } from "@/screens/DashboardGlass";

export default function HomePage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<DashboardGlass />} pro={<DashboardPro />} />
    </AppShell>
  );
}
