import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { EMAIL_CONFIG } from "@/config/email";

type BaseLayoutProps = {
  children: ReactNode;
  previewText?: string;
};

export function BaseLayout({ children, previewText }: BaseLayoutProps) {
  const { appName, logoUrl, supportUrl, privacyUrl, unsubscribeUrl } =
    EMAIL_CONFIG;

  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            {logoUrl ? (
              <Img src={logoUrl} alt={appName} height="40" style={logo} />
            ) : (
              <Text style={brandName}>{appName}</Text>
            )}
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerLinks}>
              <Link href={supportUrl} style={link}>
                Support
              </Link>
              {" · "}
              <Link href={privacyUrl} style={link}>
                Privacy
              </Link>
              {" · "}
              <Link href={unsubscribeUrl} style={link}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerMuted}>
              You received this email because you signed up for {appName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 24px",
};

const header = {
  marginBottom: "24px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const brandName = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const footer = {
  textAlign: "center" as const,
};

const footerLinks = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 0 8px",
};

const link = {
  color: "#374151",
  textDecoration: "underline",
};

const footerMuted = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0",
};

export const emailHeading = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0 0 16px",
};

export const emailText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const emailMuted = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 12px",
};

export const emailButton = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "1",
  padding: "12px 24px",
  textDecoration: "none",
};
