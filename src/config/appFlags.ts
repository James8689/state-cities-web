export const APP_FLAGS = {
  monetizationEnabled: false,
  adsEnabled: false,
} as const;

export function isMonetizationEnabled(): boolean {
  return APP_FLAGS.monetizationEnabled;
}

export function isAdsEnabled(): boolean {
  return APP_FLAGS.adsEnabled;
}
