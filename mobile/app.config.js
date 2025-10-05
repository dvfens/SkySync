// App config that reads GOOGLE MAPS API KEY from env at build/runtime
// Usage: set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key before starting Expo

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    }
  };
};


