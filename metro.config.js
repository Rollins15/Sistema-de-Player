const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Otimizações para reduzir uso de memória
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reduzir cache
config.cacheStores = [];

// Otimizar transformação
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Reduzir workers
config.maxWorkers = 2;

module.exports = config;
