import * as fs from 'fs';
import * as path from 'path';
import ignore, { Ignore } from 'ignore';

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

interface ConcatOptions {
    /** Content will be prefixed with the specified strings. */
    prefix?: string[];

    /** If true, patterns from the nearest .gitignore will be applied. */
    ignoreGit?: boolean;

    /** If true, include hidden files and directories in the concatenation process. */
    includeHidden?: boolean;

    /** A list of patterns to ignore during the concatenation process, like .gitignore files. */
    ignores?: string[];
}

interface IgnoreInfo {
    ig: Ignore;
    baseDir: string;
}

/**
 * Returns an array of file paths to be concatenated.
 *
 * @param paths - An array of file or directory paths to process.
 * @param options - Options for the concatenation process.
 * @returns An array of file paths to be concatenated.
 */
export async function getFilesToConcat(
    paths: string[],
    options: ConcatOptions = {}
): Promise<string[]> {
    const { ignoreGit = false, includeHidden = false, ignores = [] } = options;
    const ignoreCache: Map<string, IgnoreInfo | null> = new Map();

    // Load and cache the nearest .gitignore for a given directory (climbing up).
    async function loadIgnoreInfo(dir: string): Promise<IgnoreInfo | null> {
        if (ignoreCache.has(dir)) {
            return ignoreCache.get(dir)!;
        }
        const gitignorePath = path.join(dir, '.gitignore');
        try {
            await fs.promises.access(gitignorePath, fs.constants.F_OK);

            const ig = ignore();
            if (!ignoreGit) {
                const content = await fs.promises.readFile(gitignorePath, 'utf8');
                ig.add(content.split(/\r?\n/));
            }

            if (ignores.length > 0) {
                ig.add(ignores);
            }

            const info: IgnoreInfo = { ig, baseDir: dir };
            ignoreCache.set(dir, info);
            return info;
        } catch {
            const parent = path.dirname(dir);
            if (parent === dir) {
                if (ignores.length > 0) {
                    const ig = ignore();
                    ig.add(ignores);
                    const info: IgnoreInfo = { ig, baseDir: dir };
                    ignoreCache.set(dir, info);
                    return info;
                } else {
                    return null;
                }
            }

            const info = await loadIgnoreInfo(parent);
            ignoreCache.set(dir, info);
            return info;
        }
    }

    /**
     * Recursively process a path (file or directory) and collect eligible text files.
     */
    async function processPath(p: string): Promise<string[]> {
        const absPath = path.resolve(p);
        let stats: fs.Stats;
        try {
            stats = await fs.promises.stat(absPath);
        } catch {
            // Path does not exist or no permission.
            return [];
        }

        const name = path.basename(absPath);
        if (!includeHidden && name.startsWith('.')) {
            return [];
        }

        if (!ignoreGit || ignores.length > 0) {
            const targetDir = stats.isDirectory() ? absPath : path.dirname(absPath);
            const info = await loadIgnoreInfo(targetDir);
            if (info) {
                const rel = path.relative(info.baseDir, absPath);
                if (rel && info.ig.ignores(rel)) {
                    return [];
                }
            }
        }

        if (stats.isDirectory()) {
            const entries = await fs.promises.readdir(absPath);
            const nested = await Promise.all(
                entries.map(entry => processPath(path.join(absPath, entry)))
            );
            return nested.flat();
        } else if (stats.isFile()) {
            if (!isTextFile(absPath)) {
                return [];
            }
            return [absPath];
        }

        return [];
    }

    const all = await Promise.all(paths.map(p => processPath(p)));

    // Deduplicate results
    const unique = Array.from(new Set(all.flat()));
    return unique;
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
export async function concatTextFiles(paths: string[], outputFile: string, options: ConcatOptions = {}): Promise<void> {
    const filesToConcat = await getFilesToConcat(paths, options);
    const baseDirs = paths.filter(p => fs.statSync(p).isDirectory()).map(p => path.resolve(p).toLocaleLowerCase());

    const getHeaderName = (filePath: string): string => {
        const filePathLower = (path.resolve(filePath)).toLocaleLowerCase();
        for (const baseDir of baseDirs) {
            if (filePathLower.startsWith(baseDir)) {
                return path.relative(baseDir, filePath).replace(/\\/g, '/');
            }
        }

        return path.basename(filePath);
    };

    return new Promise((resolve, reject) => {
        try {
            const outputStream = fs.createWriteStream(outputFile, { encoding: 'utf-8' });
            outputStream.on('error', (err) => {
                reject(err);
            });

            outputStream.on('finish', () => {
                resolve();
            });

            if (options.prefix && options.prefix.length > 0) {
                outputStream.write(options.prefix.join('\n') + '\n\n');
            }

            const writeFile = (filePath: string) => {
                const fileName = path.basename(filePath);
                const fileExt = path.extname(filePath).toLowerCase();
                const lang = getMarkdownCodeBlock(fileExt);
                outputStream.write(`## ${getHeaderName(filePath)}\n\n\`\`\` ${lang}\n`);
                outputStream.write(fs.readFileSync(filePath, 'utf-8') + '\n');
                outputStream.write('```\n\n');
            };
        
            filesToConcat.forEach(filePath => {
                writeFile(filePath);
            });

            outputStream.end();
        } catch (err) {
            reject(err);
        }
    });
}
