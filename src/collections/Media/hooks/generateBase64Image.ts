import fs from 'fs';
import path from 'path';

export const generateBase64Image = async ({ doc }: { doc: any }) => {
    if (doc.filename) {
        const filePath = path.join(process.cwd(), 'media', doc.filename);
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath);
            doc.base64 = `data:image/png;base64,${fileContent.toString('base64')}`;
        }
    }
    return doc;
};
