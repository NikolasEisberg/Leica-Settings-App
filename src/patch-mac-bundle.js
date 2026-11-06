const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const APP_NAME = 'Leica Dial & Dot';
const APP_BUNDLE_NAME = `${APP_NAME}.app`;
const distDir = path.join(__dirname, '..', 'node_modules', 'electron', 'dist');
const pathTxtFile = path.join(__dirname, '..', 'node_modules', 'electron', 'path.txt');
const iconPngPath = path.join(__dirname, 'assets', 'icon.png');

function patchMacBundle() {
  if (process.platform !== 'darwin' || !fs.existsSync(distDir)) {
    return;
  }

  const origBundlePath = path.join(distDir, 'Electron.app');
  const namedBundlePath = path.join(distDir, APP_BUNDLE_NAME);

  // 1. Rename Electron.app -> "Leica Dial & Dot.app" and keep Electron.app as a symlink
  try {
    const origExists = fs.existsSync(origBundlePath);
    const origIsSymlink =
      origExists && fs.lstatSync(origBundlePath).isSymbolicLink();

    if (origExists && !origIsSymlink && !fs.existsSync(namedBundlePath)) {
      fs.renameSync(origBundlePath, namedBundlePath);
      fs.symlinkSync(APP_BUNDLE_NAME, origBundlePath);
    } else if (fs.existsSync(namedBundlePath) && !origExists) {
      fs.symlinkSync(APP_BUNDLE_NAME, origBundlePath);
    }
  } catch (err) {
    console.warn('Could not rename Electron.app bundle:', err.message);
  }

  const activeBundlePath = fs.existsSync(namedBundlePath)
    ? namedBundlePath
    : origBundlePath;

  if (!fs.existsSync(activeBundlePath)) {
    return;
  }

  // 2. Update node_modules/electron/path.txt so `electron .` launches "Leica Dial & Dot.app"
  if (fs.existsSync(namedBundlePath) && fs.existsSync(pathTxtFile)) {
    const desiredPathTxt = `${APP_BUNDLE_NAME}/Contents/MacOS/Electron`;
    const currentPathTxt = fs.readFileSync(pathTxtFile, 'utf-8').trim();
    if (currentPathTxt !== desiredPathTxt) {
      fs.writeFileSync(pathTxtFile, desiredPathTxt, 'utf-8');
    }
  }

  // 3. Patch Contents/Info.plist with CFBundleDisplayName & CFBundleName
  const infoPlistPath = path.join(activeBundlePath, 'Contents', 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    let plist = fs.readFileSync(infoPlistPath, 'utf-8');
    const xmlEscapedName = APP_NAME.replace(/&/g, '&amp;');

    plist = plist.replace(
      /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
      `$1${xmlEscapedName}$2`
    );
    plist = plist.replace(
      /(<key>CFBundleName<\/key>\s*<string>)[^<]*(<\/string>)/,
      `$1${xmlEscapedName}$2`
    );
    plist = plist.replace(
      /(<key>CFBundleIdentifier<\/key>\s*<string>)[^<]*(<\/string>)/,
      '$1com.leicadialanddot.app$2'
    );
    fs.writeFileSync(infoPlistPath, plist, 'utf-8');
  }

  // 4. Write localized InfoPlist.strings so macOS Menu Bar & Dock always read "Leica Dial & Dot"
  const enLprojDir = path.join(activeBundlePath, 'Contents', 'Resources', 'en.lproj');
  try {
    fs.mkdirSync(enLprojDir, { recursive: true });
    const stringsContent = `"CFBundleDisplayName" = "${APP_NAME}";\n"CFBundleName" = "${APP_NAME}";\n`;
    fs.writeFileSync(path.join(enLprojDir, 'InfoPlist.strings'), stringsContent, 'utf-8');
  } catch (err) {
    console.warn('Could not write InfoPlist.strings:', err.message);
  }

  // 5. Replace electron.icns with valid ICNS wrapping src/assets/icon.png (512x512 'ic09')
  const icnsPath = path.join(activeBundlePath, 'Contents', 'Resources', 'electron.icns');
  if (fs.existsSync(iconPngPath)) {
    try {
      const pngBuf = fs.readFileSync(iconPngPath);
      const chunkHeader = Buffer.alloc(8);
      chunkHeader.write('ic09', 0, 4, 'ascii');
      chunkHeader.writeUInt32BE(8 + pngBuf.length, 4);

      const fileHeader = Buffer.alloc(8);
      fileHeader.write('icns', 0, 4, 'ascii');
      fileHeader.writeUInt32BE(16 + pngBuf.length, 4);

      const icnsBuf = Buffer.concat([fileHeader, chunkHeader, pngBuf]);
      fs.writeFileSync(icnsPath, icnsBuf);
    } catch (err) {
      console.warn('Could not update electron.icns:', err.message);
    }
  }

  // 6. Touch the .app bundle and refresh LaunchServices registration
  try {
    const now = new Date();
    fs.utimesSync(activeBundlePath, now, now);
    const lsregister =
      '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';
    if (fs.existsSync(lsregister)) {
      execFileSync(lsregister, ['-f', activeBundlePath], { stdio: 'ignore' });
    }
  } catch {
    // Ignore if lsregister is restricted by sandbox
  }
}

patchMacBundle();
module.exports = { patchMacBundle };
