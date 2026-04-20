import { AppShell } from "@/components/AppShell";
import { ScreenSwitcher } from "@/components/ScreenSwitcher";
import { CampagneDetailPro } from "@/screens/CampagneDetailPro";
import { CampagneDetailGlass } from "@/screens/CampagneDetailGlass";
import { CAMPAIGNS } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampagneDetailPage({ params }: Props) {
  const { id } = await params;
  const campaign = CAMPAIGNS.find((c) => c.id === id);
  return (
    <AppShell campaignName={campaign?.brand}>
      <ScreenSwitcher
        glass={<CampagneDetailGlass id={id} />}
        pro={<CampagneDetailPro id={id} />}
      />
    </AppShell>
  );
}
