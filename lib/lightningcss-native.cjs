const { platform, arch } = process;

function loadNativeBinding() {
  if (platform === "win32") {
    if (arch === "x64") {
      return require("lightningcss-win32-x64-msvc");
    }
    if (arch === "arm64") {
      return require("lightningcss-win32-arm64-msvc");
    }
    throw new Error(`Unsupported lightningcss architecture on Windows: ${arch}`);
  }

  if (platform === "darwin") {
    if (arch === "arm64") {
      return require("lightningcss-darwin-arm64");
    }
    if (arch === "x64") {
      return require("lightningcss-darwin-x64");
    }
    throw new Error(`Unsupported lightningcss architecture on macOS: ${arch}`);
  }

  if (platform === "linux") {
    const { MUSL, familySync } = require("detect-libc");
    const family = familySync();

    if (arch === "x64") {
      return family === MUSL
        ? require("lightningcss-linux-x64-musl")
        : require("lightningcss-linux-x64-gnu");
    }

    if (arch === "arm64") {
      return family === MUSL
        ? require("lightningcss-linux-arm64-musl")
        : require("lightningcss-linux-arm64-gnu");
    }

    if (arch === "arm") {
      return require("lightningcss-linux-arm-gnueabihf");
    }

    throw new Error(`Unsupported lightningcss architecture on Linux: ${arch}`);
  }

  if (platform === "freebsd" && arch === "x64") {
    return require("lightningcss-freebsd-x64");
  }

  throw new Error(`Unsupported platform for lightningcss native binding: ${platform} ${arch}`);
}

const binding = loadNativeBinding();

module.exports = binding;
module.exports.browserslistToTargets = require("lightningcss/node/browserslistToTargets");
module.exports.composeVisitors = require("lightningcss/node/composeVisitors");
module.exports.Features = require("lightningcss/node/flags").Features;
