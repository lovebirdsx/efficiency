import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import { concatTextFiles } from '../common/fileMerger';

suite('concatTextFiles', function () {
    let tempDir: string;
    let outputFile: string;

    setup(function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fileMerger-'));
        outputFile = path.join(tempDir, 'output.md');
    });

    teardown(function () {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should concatenate multiple text files into the output file', async function () {
        const file1 = path.join(tempDir, 'file1.ts');
        const file2 = path.join(tempDir, 'file2.md');

        fs.writeFileSync(file1, 'console.log("File1");');
        fs.writeFileSync(file2, '# File2');

        await concatTextFiles([file1, file2], outputFile);

        const outputContent = fs.readFileSync(outputFile, 'utf-8');

        assert.strictEqual(fs.existsSync(outputFile), true);
        assert.strictEqual(outputContent,
            '## file1.ts\n\n``` typescript\n' +
            'console.log("File1");\n' +
            '```\n\n' +
            '## file2.md\n\n``` markdown\n' +
            '# File2\n' +
            '```\n\n');
    });

    test('should title relative to baseOutputDir', async function () {
        const nestedDir = path.join(tempDir, 'nested');
        fs.mkdirSync(nestedDir);

        const nestedDir2 = path.join(nestedDir, 'nested2');
        fs.mkdirSync(nestedDir2);

        const file1 = path.join(nestedDir, 'file1.txt');
        const file2 = path.join(nestedDir2, 'file2.txt');

        fs.writeFileSync(file1, 'content');
        fs.writeFileSync(file2, 'content');

        await concatTextFiles([file1, file2], outputFile, { outputBaseDir: nestedDir });
        const outputContent = fs.readFileSync(outputFile, 'utf-8');
        assert.strictEqual(fs.existsSync(outputFile), true);
        assert.strictEqual(outputContent,
            '## file1.txt\n\n``` text\n' +
            'content\n' +
            '```\n\n' +
            '## nested2/file2.txt\n\n``` text\n' +
            'content\n' +
            '```\n\n');
    });

    test('should process directories recursively', async function () {
        const dir = path.join(tempDir, 'dir');
        const subdir = path.join(dir, 'subdir');
        const file1 = path.join(dir, 'file1.ts');
        const file2 = path.join(subdir, 'file2.md');

        fs.mkdirSync(subdir, { recursive: true });

        fs.writeFileSync(file1, 'console.log("File1");');
        fs.writeFileSync(file2, '# File2');

        await concatTextFiles([dir], outputFile);

        const outputContent = fs.readFileSync(outputFile, 'utf-8');

        assert.strictEqual(fs.existsSync(outputFile), true);
        assert.strictEqual(outputContent,
            '## file1.ts\n\n``` typescript\n' +
            'console.log("File1");\n' +
            '```\n\n' +
            '## subdir/file2.md\n\n``` markdown\n' +
            '# File2\n' +
            '```\n\n');
    });

    test('should skip non-text files', async function () {
        const file1 = path.join(tempDir, 'file1.ts');
        const image = path.join(tempDir, 'image.png');

        fs.writeFileSync(file1, 'console.log("File1");');

        const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        const randomBytes = Buffer.alloc(1024);
        for (let i = 0; i < randomBytes.length; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
        }
        const pngData = Buffer.concat([pngHeader, randomBytes]);
        fs.writeFileSync(image, pngData);

        await concatTextFiles([file1, image], outputFile);

        const outputContent = fs.readFileSync(outputFile, 'utf-8');

        assert.strictEqual(fs.existsSync(outputFile), true);
        assert.strictEqual(outputContent,
            '## file1.ts\n\n``` typescript\n' +
            'console.log("File1");\n' +
            '```\n\n');
    });

    test('should handle empty paths array', async function () {
        await concatTextFiles([], outputFile);

        const outputExists = fs.existsSync(outputFile);
        const outputContent = outputExists ? fs.readFileSync(outputFile, 'utf-8') : '';

        assert.strictEqual(outputExists, true);
        assert.strictEqual(outputContent, '');
    });

    test('should handle non-existing paths gracefully', function () {
        const nonexistentPath = path.join(tempDir, 'nonexistent');

        assert.rejects(concatTextFiles([nonexistentPath], outputFile));
        assert.strictEqual(fs.existsSync(outputFile), false);
    });
});