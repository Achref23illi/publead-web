import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { NotificationsScreenPro } from "@/screens/NotificationsScreenPro";
import { NotificationsScreenGlass } from "@/screens/NotificationsScreenGlass";

export default function NotificationsPage() {
  return (
    <AppShell>
      <ScreenSwitcher
        glass={<NotificationsScreenGlass />}
        pro={<NotificationsScreenPro />}
      />
    </AppShell>
  );
}
