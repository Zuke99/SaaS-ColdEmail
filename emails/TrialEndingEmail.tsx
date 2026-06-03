import { Button, Section, Text } from "@react-email/components";
import {
  BaseLayout,
  emailButton,
  emailHeading,
  emailText,
} from "@/emails/components/BaseLayout";
import { EMAIL_CONFIG } from "@/config/email";

type TrialEndingEmailProps = {
  firstName: string;
  daysLeft: number;
};

export function TrialEndingEmail({
  firstName,
  daysLeft,
}: TrialEndingEmailProps) {
  const { appName, pricingUrl } = EMAIL_CONFIG;

  return (
    <BaseLayout previewText={`Your ${appName} trial ends in ${daysLeft} days`}>
      <Text style={emailHeading}>
        Your trial ends in {daysLeft} {daysLeft === 1 ? "day" : "days"}
      </Text>
      <Text style={emailText}>Hi {firstName},</Text>
      <Text style={emailText}>
        Your free trial of {appName} is ending soon. Upgrade now to keep
        access to all features without interruption.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={pricingUrl} style={emailButton}>
          Upgrade now
        </Button>
      </Section>
    </BaseLayout>
  );
}

export default TrialEndingEmail;
