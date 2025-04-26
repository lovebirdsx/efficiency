import * as fs from 'fs';
import * as path from 'path';

const extConfig: { [ext: string]: string } = {
    '.txt': 'text',
    '.md': 'markdown',
    '.py': 'python',
    '.h': 'cpp',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.java': 'java',
    '.html': 'html',
    '.css': 'css',
    '.js': 'javascript',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sql': 'sql',
    '.go': 'go',
    '.sh': 'bash',
    '.bat': 'batch',
    '.php': 'php',
    '.rb': 'ruby',
    '.swift': 'swift',
    '.r': 'r',
    '.pl': 'perl',
    '.lua': 'lua',
    '.dart': 'dart',
    '.kotlin': 'kotlin',
    '.scala': 'scala',
    '.groovy': 'groovy',
    '.vb': 'vbnet',
    '.vbproj': 'xml',
    '.csproj': 'xml',
    '.sln': 'xml',
    '.xaml': 'xml',
    '.jsonproj': 'json',
    '.config': 'xml',
    '.properties': 'properties',
    '.env': 'properties',
};

function isTextFile(path: string, sampleSize = 512): boolean {
    const buffer = Buffer.alloc(sampleSize);
    const fd = fs.openSync(path, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, sampleSize, 0);
    fs.closeSync(fd);

    let nonText = 0;
    for (let i = 0; i < bytesRead; i++) {
        const byte = buffer[i];
        // Allow \n, \r, \t and 0x20–0x7E (common visible characters)
        if (byte === 0x09 || byte === 0x0A || byte === 0x0D) { continue; }
        if (byte >= 0x20 && byte <= 0x7E) { continue; }
        nonText++;
    }

    // If non-text characters are more than 5% of the total bytes read, consider it a binary file
    return (nonText / bytesRead) < 0.05;
}

function getMarkdownCodeBlock(fileExt: string): string {
    return extConfig[fileExt] ?? 'plaintext';
}

/**
 * Concatenates multiple text files into a single output file.
 *
 * @param paths - An array of file or directory paths to process.
 * @param outputFile - The path to the output file where the concatenated content will be written.
 *
 * This function recursively processes each path provided. If a path is a directory, it will
 * process all text files within it and its subdirectories. For each text file, the function
 * appends its content to the output file, formatted with Markdown code blocks.
 * 
 */
export function concatTextFiles(paths: string[], outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const outputStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });

        outputStream.on('error', (err) => {
            reject(err);
        });

        outputStream.on('finish', () => {
            resolve();
        });

        const writeFile = (filePath: string, base?: string) => {
            const fileName = path.basename(filePath);
            const fileExt = path.extname(filePath).toLowerCase();
            const lang = getMarkdownCodeBlock(fileExt);
            const relativePath = base ? `${base}/${fileName}` : fileName;
            outputStream.write(`## ${relativePath}\n\n\`\`\` ${lang}\n`);
            outputStream.write(fs.readFileSync(filePath, 'utf-8') + '\n');
            outputStream.write('```\n\n');
        };

        function processPath(targetPath: string, base?: string) {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) {
                const files = fs.readdirSync(targetPath);
                for (const file of files) {
                    const filePath = path.join(targetPath, file);
                    const fileStat = fs.statSync(filePath);
                    if (fileStat.isDirectory()) {
                        processPath(filePath, base ? `${base}/${file}` : file);
                    } else if (isTextFile(filePath)) {
                        writeFile(filePath, base);
                    }
                }
            } else if (stat.isFile() && isTextFile(targetPath)) {
                writeFile(targetPath, base);
            }
        }

        try {
            for (const p of paths) {
                processPath(p);
            }
            outputStream.end(); // 结束写入并触发 'finish' 事件
        } catch (err) {
            reject(err);
        }
    });
}
