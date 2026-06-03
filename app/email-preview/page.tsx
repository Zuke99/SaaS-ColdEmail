import { render } from "@react-email/components";
import { redirect } from "next/navigation";
import { PaymentSuccessEmail } from "@/emails/PaymentSuccessEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { SubscriptionCancelledEmail } from "@/emails/SubscriptionCancelledEmail";
import { TrialEndingEmail } from "@/emails/TrialEndingEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

const PREVIEWS = [
  {
    id: "welcome",
    name: "Welcome",
    element: WelcomeEmail({ firstName: "Alex" }),
  },
  {
    id: "password-reset",
    name: "Password reset",
    element: PasswordResetEmail({
      resetUrl: "https://example.com/reset?token=mock",
    }),
  },
  {
    id: "payment-success",
    name: "Payment success",
    element: PaymentSuccessEmail({
      firstName: "Alex",
      planName: "Pro",
      amount: "$19.00",
      nextBillingDate: "April 3, 2026",
    }),
  },
  {
    id: "subscription-cancelled",
    name: "Subscription cancelled",
    element: SubscriptionCancelledEmail({
      firstName: "Alex",
      planName: "Pro",
      accessUntil: "April 3, 2026",
    }),
  },
  {
    id: "trial-ending",
    name: "Trial ending",
    element: TrialEndingEmail({ firstName: "Alex", daysLeft: 3 }),
  },
] as const;

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const selectedId = searchParams.template ?? PREVIEWS[0].id;
  const selected =
    PREVIEWS.find((p) => p.id === selectedId) ?? PREVIEWS[0];
  const html = await render(selected.element);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Email preview</h1>
        <p className="mt-2 text-sm text-gray-600">
          Development only. Pick a template to preview rendered HTML.
        </p>

        <nav className="mt-6 flex flex-wrap gap-2">
          {PREVIEWS.map((preview) => (
            <a
              key={preview.id}
              href={`/email-preview?template=${preview.id}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                preview.id === selected.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {preview.name}
            </a>
          ))}
        </nav>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <iframe
            title={`Preview: ${selected.name}`}
            srcDoc={html}
            className="h-[720px] w-full border-0"
            sandbox=""
          />
        </div>
      </div>
    </main>
  );
}
