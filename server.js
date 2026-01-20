import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3005;

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));

app.post('/api/save', async (req, res) => {
    try {
        const { folderName, originalFileName, pptxBase64, analysisJson, images } = req.body;

        const outputRoot = path.join(__dirname, 'output');
        const targetDir = path.join(outputRoot, folderName);
        const imagesDir = path.join(targetDir, 'images');

        // 1. Create directory structure
        await fs.ensureDir(imagesDir);

        // 2. Save PPTX
        const fileNameBase = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : "result";
        const pptxFileName = `${fileNameBase}_변환.pptx`;
        const pptxBuffer = Buffer.from(pptxBase64, 'base64');
        await fs.writeFile(path.join(targetDir, pptxFileName), pptxBuffer);

        // 3. Save Analysis JSON
        await fs.writeJson(path.join(targetDir, 'analysis.json'), analysisJson, { spaces: 2 });

        // 4. Save Images
        for (const img of images) {
            const imgBuffer = Buffer.from(img.data, 'base64');
            await fs.writeFile(path.join(imagesDir, img.name), imgBuffer);
        }

        console.log(`Successfully saved to ${targetDir}`);
        res.json({ success: true, path: targetDir });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Save server running on http://localhost:${PORT}`);
});
