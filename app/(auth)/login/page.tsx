import {
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/actions/auth";
import {
  AuthCard,
  AuthDivider,
  AuthLink,
  GoogleButton,
} from "@/components/auth/AuthCard";

type LoginPageProps = {
  searchParams: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
      error={error}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <AuthLink href="/signup">Sign up</AuthLink>
        </>
      }
    >
      <form action={signInWithEmail} className="space-y-4">
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
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Sign in
        </button>
      </form>

      <AuthDivider />
      <GoogleButton action={signInWithGoogle} />
    </AuthCard>
  );
}
