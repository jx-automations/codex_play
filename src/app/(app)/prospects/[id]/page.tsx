import { ProspectDetail } from "@/components/prospects/ProspectDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProspectDetail prospectId={id} />;
}
