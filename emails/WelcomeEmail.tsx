import { Button, Section, Text } from "@react-email/components";
import {
  BaseLayout,
  emailButton,
  emailHeading,
  emailText,
} from "@/emails/components/BaseLayout";
import { getEmailConfig } from "@/config/email";

type WelcomeEmailProps = {
  firstName: string;
};

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  const { appName, dashboardUrl } = getEmailConfig();

  return (
    <BaseLayout previewText={`Welcome to ${appName}, ${firstName}!`}>
      <Text style={emailHeading}>
        Welcome to {appName}, {firstName}!
      </Text>
      <Text style={emailText}>
        Thanks for signing up. {appName} helps you launch and grow your SaaS
        faster with auth, billing, and email built in from day one.
      </Text>
      <Text style={emailText}>
        Your account is ready — head to your dashboard to get started.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={dashboardUrl} style={emailButton}>
          Go to Dashboard
        </Button>
      </Section>
      <Text style={emailText}>
        Cheers,
        <br />
        The {appName} team
      </Text>
    </BaseLayout>
  );
}

export default WelcomeEmail;
