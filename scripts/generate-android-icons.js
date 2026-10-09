const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'src', 'app', 'icon.svg');
  const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found at:', svgPath);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // Density configurations for mipmap icons
  const densities = [
    { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  console.log('Generating launcher icons from icon.svg...');

  for (const density of densities) {
    const dir = path.join(resDir, density.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Standard square/rounded icon
    await sharp(svgBuffer)
      .resize(density.size, density.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. Round launcher icon
    // Create circle mask
    const circleMask = Buffer.from(
      `<svg width="${density.size}" height="${density.size}"><circle cx="${density.size / 2}" cy="${density.size / 2}" r="${density.size / 2}" fill="#ffffff"/></svg>`
    );
    await sharp(svgBuffer)
      .resize(density.size, density.size)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. Adaptive icon foreground (centered icon inside larger canvas)
    const iconInnerSize = Math.round(density.fgSize * 0.7);
    const innerIcon = await sharp(svgBuffer)
      .resize(iconInnerSize, iconInnerSize)
      .toBuffer();

    await sharp({
      create: {
        width: density.fgSize,
        height: density.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerIcon, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${density.name} (${density.size}x${density.size})`);
  }

  // 4. Generate splash screen
  console.log('Generating splash screen...');
  const splashDirs = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const s of splashDirs) {
    const targetDir = path.join(resDir, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const logoSize = Math.min(Math.round(Math.min(s.w, s.h) * 0.4), 256);
    const splashLogo = await sharp(svgBuffer)
      .resize(logoSize, logoSize)
      .toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 79, g: 70, b: 229, alpha: 1 } // #4f46e5 (Indigo)
      }
    })
      .composite([{ input: splashLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'splash.png'));
  }

  console.log('All icons and splash screens generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
