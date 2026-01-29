const fs = require('fs');
const path = require('path');

const galleryPath = path.join(process.cwd(), 'assets', 'gallery.json');
const gallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));

console.log(`Checking ${gallery.length} items...`);

gallery.forEach(item => {
    if (item.thumbnail) {
        const thumbPath = path.join(process.cwd(), item.thumbnail);
        if (!fs.existsSync(thumbPath)) {
            console.error(`[MISSING] Thumbnail for ${item.id}: ${item.thumbnail}`);
        } else {
            console.log(`[OK] Thumbnail for ${item.id}`);
        }
    }
});
