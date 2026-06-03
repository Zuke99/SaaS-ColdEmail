import Link from "next/link";
import { env } from "@/env";

export function BlogPostCTA() {
  return (
    <section className="mt-12 rounded-xl border border-gray-200 bg-gray-900 px-6 py-8 text-center text-white sm:px-10">
      <h2 className="text-xl font-bold sm:text-2xl">
        Ready to try {env.NEXT_PUBLIC_APP_NAME}?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-gray-300 sm:text-base">
        Ship faster with auth, billing, and email built in. Start free and
        upgrade when you are ready.
      </p>
      <Link
        href="/signup"
        className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
      >
        Get started
      </Link>
    </section>
  );
}
