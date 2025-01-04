import * as fs from 'fs';
import * as path from 'path';

function isTextFile(filePath: string): boolean {
    const textExts: string[] = ['.txt', '.md', '.py', '.h', '.ts', '.c', '.cpp', '.cs', '.java', '.html', '.css', '.js'];
    const fileExt = path.extname(filePath).toLowerCase();
    return textExts.includes(fileExt);
}

function getMarkdownCodeBlock(fileExt: string): string {
    const extToLang: { [key: string]: string } = {
        '.txt': 'text',
        '.md': 'markdown',
        '.py': 'python',
        '.h': 'cpp',
        '.ts': 'typescript',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.java': 'java',
        '.html': 'html',
        '.css': 'css',
        '.js': 'javascript'
    };
    return extToLang[fileExt] || '';
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

        const writeFile = (filePath: string) => {
            const fileName = path.basename(filePath);
            const fileExt = path.extname(filePath).toLowerCase();
            const lang = getMarkdownCodeBlock(fileExt);
            outputStream.write(`## ${fileName}\n\n\`\`\` ${lang}\n`);
            outputStream.write(fs.readFileSync(filePath, 'utf-8') + '\n');
            outputStream.write('```\n\n');
        }

        function processPath(targetPath: string) {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) {
                const files = fs.readdirSync(targetPath);
                for (const file of files) {
                    const filePath = path.join(targetPath, file);
                    const fileStat = fs.statSync(filePath);
                    if (fileStat.isDirectory()) {
                        processPath(filePath);
                    } else if (isTextFile(file)) {
                        writeFile(filePath);
                    }
                }
            } else if (stat.isFile() && isTextFile(targetPath)) {
                writeFile(targetPath);
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
