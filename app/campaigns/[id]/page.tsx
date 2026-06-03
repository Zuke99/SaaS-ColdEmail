import { CampaignDetailContent } from "@/components/campaigns/CampaignDetailContent";

type CampaignDetailPageProps = {
  params: { id: string };
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return <CampaignDetailContent campaignId={params.id} />;
}
