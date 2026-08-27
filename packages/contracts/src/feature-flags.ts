export type FeatureFlags = {
  liveTradingEnabled: boolean;
  automatedLiveTradingEnabled: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  liveTradingEnabled: false,
  automatedLiveTradingEnabled: false,
};
