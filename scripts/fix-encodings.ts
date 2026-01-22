import fs from 'fs';
import path from 'path';

const searchDirs = [
    'f:\\PRESUPUESTALO\\WEB-PRODUCCIÓN\\app',
    'f:\\PRESUPUESTALO\\WEB-PRODUCCIÓN\\lib',
    'f:\\PRESUPUESTALO\\WEB-PRODUCCIÓN\\components',
];

const replacements = [
    { from: /Ã¡/g, to: 'á' },
    { from: /Ã©/g, to: 'é' },
    { from: /Ã­/g, to: 'í' },
    { from: /Ã³/g, to: 'ó' },
    { from: /Ãº/g, to: 'ú' },
    { from: /Ã±/g, to: 'ñ' },
    { from: /Ã /g, to: 'á' }, // Often 'á' is misinterpreted this way too
    { from: /Ã\u00A1/g, to: 'á' },
    { from: /Ã\u00A9/g, to: 'é' },
    { from: /Ã\u00AD/g, to: 'í' },
    { from: /Ã\u00B3/g, to: 'ó' },
    { from: /Ã\u00BA/g, to: 'ú' },
    { from: /Ã\u00B1/g, to: 'ñ' },
    { from: /Â¡/g, to: '¡' },
    { from: /Â¿/g, to: '¿' },
    { from: /â‚¬/g, to: '€' },
    { from: /Ã‰/g, to: 'É' },
    { from: /Ã“/g, to: 'Ó' },
    { from: /Ã /g, to: 'À' }, // risky
    { from: /Ãš/g, to: 'Ú' },
    { from: /Ã /g, to: 'Í' },
    // Emoji fixes
    { from: /ðŸ“§/g, to: '📧' },
    { from: /â Œ/g, to: '❌' },
    { from: /âœ…/g, to: '✅' },
    { from: /ðŸ“¤/g, to: '📤' },
    { from: /ðŸ“¥/g, to: '📥' },
    { from: /ðŸ’¥/g, to: '💥' },
    { from: /ðŸŽ‰/g, to: '🎉' },
    { from: /ðŸ” /g, to: '🔍' },
    { from: /âš /g, to: '⚠️' },
    { from: /ðŸ“±/g, to: '📱' },
];

function walk(dir: string, callback: (file: string) => void) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach((f) => {
        const dirPath = path.join(dir, f);
        if (f === 'node_modules' || f === '.next' || f === '.git') return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

searchDirs.forEach(dir => {
    walk(dir, (file) => {
        if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(file, 'utf8');
            let modified = false;

            replacements.forEach((rep) => {
                if (rep.from.test(content)) {
                    content = content.replace(rep.from, rep.to);
                    modified = true;
                }
            });

            if (modified) {
                console.log(`Fixing encoding in: ${file}`);
                fs.writeFileSync(file, content, 'utf8');
            }
        }
    });
});
