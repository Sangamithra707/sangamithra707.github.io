const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../assets/models');
const OUTPUT_FILE = path.join(__dirname, '../assets/gallery.json');

// Ensure output directory exists (technically assets should exist, but good practice)
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

function generateIndex() {
    console.log(`Scanning ${MODELS_DIR}...`);

    if (!fs.existsSync(MODELS_DIR)) {
        console.error(`Error: Directory ${MODELS_DIR} does not exist.`);
        return;
    }

    const items = fs.readdirSync(MODELS_DIR, { withFileTypes: true });

    // Filter for directories only
    const modelFolders = items.filter(item => item.isDirectory());

    const galleryData = [];

    modelFolders.forEach(folder => {
        const folderPath = path.join(MODELS_DIR, folder.name);
        const infoPath = path.join(folderPath, 'info.json');

        if (fs.existsSync(infoPath)) {
            try {
                const infoContent = fs.readFileSync(infoPath, 'utf8');
                const info = JSON.parse(infoContent);

                // Find extra images
                const files = fs.readdirSync(folderPath);
                const allImages = files.filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
                });

                // Logic to select main thumbnail
                // 1. High Priority: Explicit 'thumbnail.*' (User request: "show the thumbnail named image")
                let thumbFile = allImages.find(f => f.toLowerCase().startsWith('thumbnail.'));

                // 2. Fallback: If no 'thumbnail.*', use the first available image
                // (Matches: "if that folder has image file other than thumbnail load that images" -> as fallback)
                if (!thumbFile && allImages.length > 0) {
                    thumbFile = allImages[0];
                }

                // 3. Fallback (files.js/main.js should handle missing)
                const thumbnailPath = thumbFile ? `assets/models/${folder.name}/${thumbFile}` : '';

                // Include ALL images in the strip (including thumbnail.jpg if desired)
                const extraImages = allImages.map(file => `assets/models/${folder.name}/${file}`);

                // Add folder ID to the object (derived from folder name)
                const modelEntry = {
                    id: folder.name,
                    ...info,
                    // Auto-detect paths if not specified
                    thumbnail: thumbnailPath,
                    images: extraImages,
                    vertices: info.vertices || ''
                };

                // Validate critical fields
                if (!info.title) console.warn(`Warning: ${folder.name}/info.json missing 'title'`);

                galleryData.push(modelEntry);
                console.log(`Loaded: ${info.title || folder.name}`);
            } catch (err) {
                console.error(`Error parsing ${infoPath}:`, err.message);
            }
        } else {
            console.log(`Skipping ${folder.name}: No info.json found.`);
        }
    });

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(galleryData, null, 2));
    console.log(`\nSuccessfully generated gallery.json with ${galleryData.length} items.`);
}

generateIndex();
