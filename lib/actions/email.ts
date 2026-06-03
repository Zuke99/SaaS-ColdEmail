"use server";

import { EMAIL_CONFIG } from "@/config/email";
import { PaymentSuccessEmail } from "@/emails/PaymentSuccessEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { SubscriptionCancelledEmail } from "@/emails/SubscriptionCancelledEmail";
import { TrialEndingEmail } from "@/emails/TrialEndingEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendEmail } from "@/lib/email";

export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
}) {
  const { appName } = EMAIL_CONFIG;

  return sendEmail({
    to: user.email,
    subject: `Welcome to ${appName}!`,
    template: WelcomeEmail({ firstName: user.firstName }),
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const { appName } = EMAIL_CONFIG;

  return sendEmail({
    to: email,
    subject: `Reset your ${appName} password`,
    template: PasswordResetEmail({ resetUrl }),
  });
}

export async function sendPaymentSuccessEmail(
  user: { email: string; firstName: string },
  payment: { planName: string; amount: string; nextBillingDate: string }
) {
  const { appName } = EMAIL_CONFIG;

  return sendEmail({
    to: user.email,
    subject: `Payment confirmed — ${appName}`,
    template: PaymentSuccessEmail({
      firstName: user.firstName,
      planName: payment.planName,
      amount: payment.amount,
      nextBillingDate: payment.nextBillingDate,
    }),
  });
}

export async function sendTrialEndingEmail(
  user: { email: string; firstName: string },
  daysLeft: number
) {
  const { appName } = EMAIL_CONFIG;

  return sendEmail({
    to: user.email,
    subject: `Your ${appName} trial ends in ${daysLeft} days`,
    template: TrialEndingEmail({ firstName: user.firstName, daysLeft }),
  });
}

export async function sendSubscriptionCancelledEmail(
  user: { email: string; firstName: string },
  details: { planName: string; accessUntil: string }
) {
  const { appName } = EMAIL_CONFIG;

  return sendEmail({
    to: user.email,
    subject: `Your ${appName} subscription has been cancelled`,
    template: SubscriptionCancelledEmail({
      firstName: user.firstName,
      planName: details.planName,
      accessUntil: details.accessUntil,
    }),
  });
}
