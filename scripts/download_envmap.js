import fs from 'fs';
import path from 'path';
import https from 'https';

const ENVMAP_DIR = 'src/assets/textures/envmap';
const ENVMAP_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/4k/winter_evening_4k.exr';

// Create directory if it doesn't exist
if (!fs.existsSync(ENVMAP_DIR)) {
    fs.mkdirSync(ENVMAP_DIR, { recursive: true });
}

// Download the environment map
const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

// Main function
async function main() {
    try {
        console.log('Downloading environment map...');
        await download(ENVMAP_URL, path.join(ENVMAP_DIR, 'envmap.exr'));
        console.log('Environment map downloaded successfully!');
    } catch (error) {
        console.error('Error downloading environment map:', error);
    }
}

main(); 