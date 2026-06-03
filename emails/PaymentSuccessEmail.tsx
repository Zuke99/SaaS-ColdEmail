import { Button, Section, Text } from "@react-email/components";
import {
  BaseLayout,
  emailButton,
  emailHeading,
  emailMuted,
  emailText,
} from "@/emails/components/BaseLayout";
import { getEmailConfig } from "@/config/email";

type PaymentSuccessEmailProps = {
  firstName: string;
  planName: string;
  amount: string;
  nextBillingDate: string;
};

export function PaymentSuccessEmail({
  firstName,
  planName,
  amount,
  nextBillingDate,
}: PaymentSuccessEmailProps) {
  const { appName, dashboardUrl } = getEmailConfig();

  return (
    <BaseLayout previewText={`Payment confirmed — ${appName}`}>
      <Text style={emailHeading}>Payment confirmed 🎉</Text>
      <Text style={emailText}>Hi {firstName},</Text>
      <Text style={emailText}>
        Your payment was successful. Here is a summary of your subscription:
      </Text>
      <Text style={emailText}>
        <strong>Plan:</strong> {planName}
        <br />
        <strong>Amount:</strong> {amount}
        <br />
        <strong>Next billing date:</strong> {nextBillingDate}
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={dashboardUrl} style={emailButton}>
          Go to Dashboard
        </Button>
      </Section>
      <Text style={emailMuted}>
        You can manage your subscription, update billing details, or cancel
        anytime from the customer portal in your dashboard settings.
      </Text>
    </BaseLayout>
  );
}

export default PaymentSuccessEmail;
