import {
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/actions/auth";
import {
  AuthCard,
  AuthDivider,
  AuthLink,
  GoogleButton,
} from "@/components/auth/AuthCard";

type SignupPageProps = {
  searchParams: { error?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const error = searchParams.error;

  return (
    <AuthCard
      title="Create an account"
      subtitle="Get started with your SaaS"
      error={error}
      footer={
        <>
          Already have an account?{" "}
          <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <form action={signUpWithEmail} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Create account
        </button>
      </form>

      <AuthDivider />
      <GoogleButton action={signInWithGoogle} />
    </AuthCard>
  );
}
