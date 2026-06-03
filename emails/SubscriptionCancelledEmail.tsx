import { Button, Link, Section, Text } from "@react-email/components";
import {
  BaseLayout,
  emailButton,
  emailHeading,
  emailMuted,
  emailText,
} from "@/emails/components/BaseLayout";
import { getEmailConfig } from "@/config/email";

type SubscriptionCancelledEmailProps = {
  firstName: string;
  planName: string;
  accessUntil: string;
};

export function SubscriptionCancelledEmail({
  firstName,
  planName,
  accessUntil,
}: SubscriptionCancelledEmailProps) {
  const { appName, pricingUrl, supportUrl } = getEmailConfig();

  return (
    <BaseLayout previewText={`Your ${appName} subscription has been cancelled`}>
      <Text style={emailHeading}>Your subscription has been cancelled</Text>
      <Text style={emailText}>Hi {firstName},</Text>
      <Text style={emailText}>
        Your {planName} subscription for {appName} has been cancelled. You
        will keep access to paid features until <strong>{accessUntil}</strong>.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={pricingUrl} style={emailButton}>
          Resubscribe
        </Button>
      </Section>
      <Text style={emailMuted}>
        Cancelled by mistake?{" "}
        <Link href={supportUrl} style={{ color: "#374151" }}>
          Contact support
        </Link>{" "}
        and we&apos;ll help restore your plan.
      </Text>
    </BaseLayout>
  );
}

export default SubscriptionCancelledEmail;
