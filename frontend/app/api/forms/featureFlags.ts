// Define types for the feature flags and tiers
type FeatureFlag = {
  SPAM_DETECTION: boolean;
  IP_REPUTATION_CHECK: boolean;
  CAPTCHA_VERIFICATION: boolean;
  MAX_REQUESTS_PER_MINUTE: number;
};

type UserTier = "free" | "paid";

const feature_flags: Record<UserTier, FeatureFlag> = {
  free: {
    SPAM_DETECTION: false,
    IP_REPUTATION_CHECK: true,
    CAPTCHA_VERIFICATION: false,
    MAX_REQUESTS_PER_MINUTE: 10, // Rate limit for free tier
  },
  paid: {
    SPAM_DETECTION: true,
    IP_REPUTATION_CHECK: true,
    CAPTCHA_VERIFICATION: true,
    MAX_REQUESTS_PER_MINUTE: 100, // Rate limit for paid tier
  },
};

export default feature_flags;
