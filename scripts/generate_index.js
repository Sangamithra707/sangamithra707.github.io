const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../assets/models');
const OUTPUT_FILE = path.join(__dirname, '../assets/gallery.json');
const CSV_FILE = path.join(__dirname, '../products_data.csv');

// Ensure output directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Simple CSV Parser
// Robust CSV Parser dealing with multi-line strings and quotes
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuote = false;

    // Normalize newlines to \n to simplify logic (optional but helpful)
    // But character-by-character is safer for streams. Here we have full string.

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (inQuote) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i++;
                } else {
                    // End of quote
                    inQuote = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                // Field separator
                currentRow.push(currentField.trim()); // Trim whitespace around unquoted fields
                currentField = '';
            } else if (char === '\r' || char === '\n') {
                // Row separator
                // Handle CRLF or LF
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }

                // End of row
                currentRow.push(currentField.trim());
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    // Push last row if data remains
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    // Convert to Objects
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim());
    const data = [];

    for (let j = 1; j < rows.length; j++) {
        const row = rows[j];
        // Skip empty rows or rows that don't match header length vaguely (optional validity check)
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        const entry = {};
        headers.forEach((header, index) => {
            // Remove any leftover quotes if the trimming didn't catch weird cases, 
            // but our logic above doesn't include enclosing quotes in currentField.
            entry[header] = row[index] || '';
        });

        // Safety: Only add if ID exists (handled later in main logic, but good here too)
        if (Object.keys(entry).length > 0) {
            data.push(entry);
        }
    }

    return data;
}

function generateIndex() {
    console.log(`Reading CSV from ${CSV_FILE}...`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error(`Error: CSV file ${CSV_FILE} does not exist.`);
        return;
    }

    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const products = parseCSV(csvContent);

    console.log(`Found ${products.length} products in CSV.`);

    const galleryData = [];

    products.forEach(product => {
        const id = product.id;
        if (!id) return; // Skip if no ID

        // Ensure local model folder exists for this ID to store copied assets
        const itemFolder = path.join(MODELS_DIR, id);
        if (!fs.existsSync(itemFolder)) {
            fs.mkdirSync(itemFolder, { recursive: true });
        }

        // Helper to resolve path and COPY if absolute
        const processImagePath = (inputPath) => {
            if (!inputPath) return null;
            inputPath = inputPath.trim();
            if (!inputPath) return null;

            // 1. Handle External URL
            if (inputPath.startsWith('http')) return inputPath;

            // 2. Handle Absolute Path (Windows Drive or Unix Root)
            if (path.isAbsolute(inputPath)) {
                if (fs.existsSync(inputPath)) {
                    const filename = path.basename(inputPath);
                    const destPath = path.join(itemFolder, filename);

                    try {
                        fs.copyFileSync(inputPath, destPath);
                        console.log(`  [Imported] Copied ${filename} to project.`);
                        return `assets/models/${id}/${filename}`;
                    } catch (err) {
                        console.error(`  [Error] Failed to copy ${inputPath}: ${err.message}`);
                        return null;
                    }
                } else {
                    console.warn(`  [Warning] Absolute path not found: ${inputPath}`);
                    return null;
                }
            }

            // 3. Handle Relative Path
            let relative = inputPath.replace(/^[/\\]/, '');

            if (relative.startsWith('assets/models/')) {
                return relative;
            }

            // Check assets/models/path
            const checkPath = path.join(MODELS_DIR, relative);
            if (fs.existsSync(checkPath)) {
                return `assets/models/${relative}`;
            }

            // Check assets/models/ID/path
            const checkIdPath = path.join(itemFolder, relative);
            if (fs.existsSync(checkIdPath)) {
                return `assets/models/${id}/${relative}`;
            }

            console.warn(`  [Warning] Image not found: ${relative}`);
            return `assets/models/${relative}`;
        };

        const thumbPath = processImagePath(product.thumbnail);

        // Collect extra images
        const imageColumns = ['image1', 'image2', 'image3', 'image4', 'image5'];
        const validImages = [];

        imageColumns.forEach(col => {
            const imgPath = processImagePath(product[col]);
            if (imgPath) validImages.push(imgPath);
        });

        // Add thumbnail to strip checking duplicates
        if (thumbPath) {
            if (!validImages.includes(thumbPath)) {
                validImages.unshift(thumbPath);
            }
        }

        const modelEntry = {
            id: id,
            title: product.title || 'Untitled',
            category: product.category || 'Uncategorized',
            description: product.description || '',
            vertices: product.vertices || '',
            polyCount: product.polyCount || '',
            marketplaceLink: product.marketplaceLink || '',
            thumbnail: thumbPath || '',
            images: validImages,
            textureSize: '4k',
            formats: ['GLB']
        };

        galleryData.push(modelEntry);
        console.log(`Processed: ${modelEntry.title} (ID: ${id})`);
    });

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(galleryData, null, 2));
    console.log(`\nSuccessfully generated gallery.json with ${galleryData.length} items.`);
}

generateIndex();
