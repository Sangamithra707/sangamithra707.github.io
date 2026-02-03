const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../assets/models');
const CSV_FILE = path.join(__dirname, '../products_data.csv');

function escapeCsv(val) {
    if (!val) return '';
    val = String(val);
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
}

function migrate() {
    console.log('Migrating existing info.json data to products_data.csv...');
    if (!fs.existsSync(MODELS_DIR)) {
        console.error('No models directory found.');
        return;
    }

    const folders = fs.readdirSync(MODELS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const headers = ['id', 'title', 'description', 'category', 'vertices', 'polyCount', 'marketplaceLink', 'thumbnail', 'image1', 'image2', 'image3', 'image4', 'image5'];

    // Start with header
    const csvRows = [headers.join(',')];

    folders.forEach(folder => {
        const folderPath = path.join(MODELS_DIR, folder);
        const infoPath = path.join(folderPath, 'info.json');

        // Default values
        let data = {
            id: folder,
            title: folder,
            description: '',
            category: 'Uncategorized',
            vertices: '',
            polyCount: '',
            marketplaceLink: ''
        };

        // Read info.json if exists
        if (fs.existsSync(infoPath)) {
            try {
                const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                data = { ...data, ...info };
            } catch (e) {
                console.warn(`Failed to parse ${infoPath}`);
            }
        }

        // Find images
        const files = fs.readdirSync(folderPath).filter(f => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase()));

        let thumbnail = '';
        let images = [];

        // Identify thumbnail
        const thumbFile = files.find(f => f.toLowerCase().startsWith('thumbnail.'));
        if (thumbFile) {
            thumbnail = `${folder}/${thumbFile}`;
            images = files.filter(f => f !== thumbFile).map(f => `${folder}/${f}`);
        } else {
            // Use first as thumbnail
            if (files.length > 0) {
                thumbnail = `${folder}/${files[0]}`;
                images = files.slice(1).map(f => `${folder}/${f}`);
            }
        }

        // Limit images to 5
        const currentImages = images.slice(0, 5);
        const imageColumns = Array(5).fill('');
        currentImages.forEach((img, i) => imageColumns[i] = img);

        const row = [
            escapeCsv(data.id || folder),
            escapeCsv(data.title),
            escapeCsv(data.description),
            escapeCsv(data.category),
            escapeCsv(data.vertices || ''),
            escapeCsv(data.polyCount || ''),
            escapeCsv(data.marketplaceLink || ''),
            escapeCsv(thumbnail),
            ...imageColumns.map(escapeCsv)
        ];

        csvRows.push(row.join(','));
        console.log(`Migrated ${folder}`);
    });

    fs.writeFileSync(CSV_FILE, csvRows.join('\n'));
    console.log(`\nSuccessfully created products_data.csv with ${folders.length} entries.`);
}

migrate();
