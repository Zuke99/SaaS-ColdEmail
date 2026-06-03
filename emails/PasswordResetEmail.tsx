import { Button, Section, Text } from "@react-email/components";
import {
  BaseLayout,
  emailButton,
  emailHeading,
  emailMuted,
  emailText,
} from "@/emails/components/BaseLayout";
import { getEmailConfig } from "@/config/email";

type PasswordResetEmailProps = {
  resetUrl: string;
};

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  const { appName } = getEmailConfig();

  return (
    <BaseLayout previewText={`Reset your ${appName} password`}>
      <Text style={emailHeading}>Reset your password</Text>
      <Text style={emailText}>
        We received a request to reset your password for your {appName}{" "}
        account.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={resetUrl} style={emailButton}>
          Reset Password
        </Button>
      </Section>
      <Text style={emailMuted}>This link expires in 1 hour.</Text>
      <Text style={emailMuted}>
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
    </BaseLayout>
  );
}

export default PasswordResetEmail;
