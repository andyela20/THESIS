const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    manifest.application[0].$ = {
      ...manifest.application[0].$,
      'android:usesCleartextTraffic': 'true'
    };

    return config;
  });
};
