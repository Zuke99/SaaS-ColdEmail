import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-4 text-gray-600">
            Welcome,{" "}
            <span className="font-medium text-gray-900">
              {user?.email ?? "User"}
            </span>
          </p>
          <form action={signOut} className="mt-8">
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
