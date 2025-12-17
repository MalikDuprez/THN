module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": "./src",
            "@api": "./src/api",  // ← AJOUTE CETTE LIGNE
            "@components": "./src/components",
            "@ui": "./src/components/ui",
            "@shared": "./src/components/shared",
            "@layout": "./src/components/layout",
            "@stores": "./src/stores",
            "@lib": "./src/lib",
            "@constants": "./src/constants",
            "@types": "./src/types",
            "@hooks": "./src/hooks",
            "@utils": "./src/utils",
          },
        },
      ],
    ],
  };
};