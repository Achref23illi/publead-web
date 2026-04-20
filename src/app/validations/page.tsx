import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { ValidationsPro } from "@/screens/ValidationsPro";
import { ValidationsGlass } from "@/screens/ValidationsGlass";

export default function ValidationsPage() {
  return (
    <AppShell>
      <ScreenSwitcher glass={<ValidationsGlass />} pro={<ValidationsPro />} />
    </AppShell>
  );
}
