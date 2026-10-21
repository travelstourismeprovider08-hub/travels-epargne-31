const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const svg = fs.readFileSync(path.join(__dirname, '../resources/icon.svg'));
const root = path.join(__dirname, '../android/app/src/main/res');
const sizes = { 'mipmap-mdpi':48, 'mipmap-hdpi':72, 'mipmap-xhdpi':96, 'mipmap-xxhdpi':144, 'mipmap-xxxhdpi':192 };
(async () => {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(root, folder); fs.mkdirSync(dir, {recursive:true});
    for (const name of ['ic_launcher.png','ic_launcher_round.png']) await sharp(svg).resize(size,size).png().toFile(path.join(dir,name));
    await sharp(svg).resize(Math.round(size*1.5),Math.round(size*1.5)).png().toFile(path.join(dir,'ic_launcher_foreground.png'));
  }
  console.log('T.E-31 branded launcher icons generated from the interface SVG.');
})().catch(e => { console.error(e); process.exit(1); });
