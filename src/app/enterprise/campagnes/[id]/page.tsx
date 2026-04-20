import { EnterpriseCampagneDetail } from "@/screens/enterprise/EnterpriseCampagneDetail";

export default async function EnterpriseCampagnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EnterpriseCampagneDetail id={id} />;
}
