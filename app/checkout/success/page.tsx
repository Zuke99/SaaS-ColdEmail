import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"
          aria-hidden="true"
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment successful!</h1>
        <p className="mt-4 text-sm text-gray-600">
          Thank you for your purchase. Your plan may take a few seconds to activate
          while we confirm payment with our billing provider.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Do not worry if you do not see changes immediately — access is granted
          securely via webhook, not this page.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
