const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = fs.readFileSync(path.join(__dirname, '../resources/icon.svg'));
const root = path.join(__dirname, '../android/app/src/main/res');
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

(async () => {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(root, folder);
    fs.mkdirSync(dir, { recursive: true });

    // Standard launcher icons use the complete T.E-31 logo.
    const icon = await sharp(svg).resize(size, size).png().toBuffer();
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      await fs.promises.writeFile(path.join(dir, name), icon);
    }

    // Adaptive icons need transparent padding around the foreground artwork.
    // Keep the full logo inside the safe area so Android does not crop it.
    const canvasSize = Math.round(size * 1.5);
    const foreground = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: icon,
        left: Math.round((canvasSize - size) / 2),
        top: Math.round((canvasSize - size) / 2)
      }])
      .png()
      .toBuffer();

    await fs.promises.writeFile(
      path.join(dir, 'ic_launcher_foreground.png'),
      foreground
    );
  }

  console.log('T.E-31 launcher icons generated with the complete logo centered in Android safe areas.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
