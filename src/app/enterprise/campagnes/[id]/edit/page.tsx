import { EnterpriseCampagneWizard } from "@/screens/enterprise/EnterpriseCampagneWizard";

export default async function EnterpriseEditCampagnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EnterpriseCampagneWizard initialId={id} />;
}
