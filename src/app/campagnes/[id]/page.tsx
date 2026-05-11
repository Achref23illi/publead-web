import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { CampagneDetailPro } from "@/screens/CampagneDetailPro";
import { CampagneDetailGlass } from "@/screens/CampagneDetailGlass";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampagneDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell>
      <ScreenSwitcher
        glass={<CampagneDetailGlass id={id} />}
        pro={<CampagneDetailPro id={id} />}
      />
    </AppShell>
  );
}
