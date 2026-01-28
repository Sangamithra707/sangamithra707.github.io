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
                const extraImages = files.filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file !== 'thumbnail.jpg';
                }).map(file => `assets/models/${folder.name}/${file}`);

                // Add folder ID to the object (derived from folder name)
                const modelEntry = {
                    id: folder.name,
                    ...info,
                    // Auto-detect paths if not specified
                    modelUrl: `assets/models/${folder.name}/model.glb`,
                    thumbnail: `assets/models/${folder.name}/thumbnail.jpg`,
                    images: extraImages
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
