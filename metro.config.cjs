const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = withNativeWind(getDefaultConfig(__dirname), {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});

/** Node ESM 向け `.js` 拡張子 import を Metro が `.ts` ソースへ解決できるようにする */
const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    typeof moduleName === "string" &&
    moduleName.startsWith(".") &&
    moduleName.endsWith(".js")
  ) {
    const withoutJs = moduleName.replace(/\.js$/, "");
    try {
      return context.resolveRequest(context, withoutJs, platform);
    } catch {
      // fall through to default resolver
    }
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
