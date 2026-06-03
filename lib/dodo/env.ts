export function getDodoEnvironment(): "test_mode" | "live_mode" {
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (env === "live_mode") {
    return "live_mode";
  }
  return "test_mode";
}
