import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { BornesPro } from "@/screens/BornesPro";
import { BornesGlass } from "@/screens/BornesGlass";

export default function BornesPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<BornesGlass />} pro={<BornesPro />} />
    </AppShell>
  );
}
