import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import * as sinon from 'sinon';

import { getFilesToConcat } from '../common/fileMerger';

suite('getFilesToConcat', function () {
    let tempDir: string;
    const sandbox = sinon.createSandbox();
    
    setup(function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fileMerger-'));
    });

    teardown(function () {
        fs.rmSync(tempDir, { recursive: true, force: true });
        sandbox.restore();
    });

    test('should return an empty array for empty directories', async function () {
        const files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 0);
    });

    test('should find text files in a directory', async function () {
        const textFile1 = path.join(tempDir, 'file1.txt');
        const textFile2 = path.join(tempDir, 'file2.md');
        
        fs.writeFileSync(textFile1, 'content');
        fs.writeFileSync(textFile2, 'content');
        
        const files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 2);
        assert.ok(files.includes(textFile1));
        assert.ok(files.includes(textFile2));
    });

    test('should exclude non-text files', async function () {
        const textFile = path.join(tempDir, 'file.txt');
        const binaryFile = path.join(tempDir, 'image.png');
        
        fs.writeFileSync(textFile, 'content');
        fs.writeFileSync(binaryFile, Buffer.from([0xFF, 0xD8, 0xFF]));
        
        const files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(textFile));
        assert.ok(!files.includes(binaryFile));
    });

    test('should respect includeHidden option', async function () {
        const normalFile = path.join(tempDir, 'normal.txt');
        const hiddenFile = path.join(tempDir, '.hidden.txt');
        
        fs.writeFileSync(normalFile, 'content');
        fs.writeFileSync(hiddenFile, 'content');
        
        // Default behavior (includeHidden = false)
        let files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(normalFile));
        
        // With includeHidden = true
        files = await getFilesToConcat([tempDir], { includeHidden: true });
        assert.strictEqual(files.length, 2);
        assert.ok(files.includes(normalFile));
        assert.ok(files.includes(hiddenFile));
    });

    test('should process nested directories', async function () {
        const nestedDir = path.join(tempDir, 'nested');
        fs.mkdirSync(nestedDir);
        
        const file1 = path.join(tempDir, 'file1.txt');
        const file2 = path.join(nestedDir, 'file2.txt');
        
        fs.writeFileSync(file1, 'content');
        fs.writeFileSync(file2, 'content');
        
        const files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 2);
        assert.ok(files.includes(file1));
        assert.ok(files.includes(file2));
    });

    test('should respect gitignore rules when ignoreGit is false', async function () {
        const ignoredFile = path.join(tempDir, 'ignored.txt');
        const normalFile = path.join(tempDir, 'normal.txt');
        const gitignoreContent = 'ignored.txt';
        
        fs.writeFileSync(path.join(tempDir, '.gitignore'), gitignoreContent);
        fs.writeFileSync(ignoredFile, 'content');
        fs.writeFileSync(normalFile, 'content');
        
        // Default behavior (ignoreGit = false)
        let files = await getFilesToConcat([tempDir], { ignoreGit: true });
        assert.strictEqual(files.length, 2);
        
        // With ignoreGit = true
        files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(normalFile));
        assert.ok(!files.includes(ignoredFile));
    });

    test('should deduplicate results', async function () {
        const file = path.join(tempDir, 'file.txt');
        fs.writeFileSync(file, 'content');
        
        const files = await getFilesToConcat([tempDir, tempDir, file]);
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(file));
    });

    test('should handle non-existent paths gracefully', async function () {
        const nonExistentPath = path.join(tempDir, 'non-existent');
        const existingFile = path.join(tempDir, 'file.txt');
        
        fs.writeFileSync(existingFile, 'content');
        
        const files = await getFilesToConcat([nonExistentPath, existingFile]);
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(existingFile));
    });

    test('bugfix: node_modules should be ignored', async function () {
        const dir = path.join(tempDir, 'node_modules');
        fs.mkdirSync(dir);
        const file1 = path.join(dir, 'file1.txt');
        const file2 = path.join(tempDir, 'file2.txt');
        const gitIgnore = path.join(tempDir, '.gitignore');
        
        fs.writeFileSync(file1, 'content');
        fs.writeFileSync(file2, 'content');
        fs.writeFileSync(gitIgnore, 'node_modules');

        const files = await getFilesToConcat([tempDir]);
        assert.strictEqual(files.length, 1);

        assert.ok(files.includes(file2));
    });

    test('should respect custom ignores option', async function () {
        const normalFile = path.join(tempDir, 'normal.txt');
        const ignoredFile = path.join(tempDir, 'ignored.txt');
        const anotherIgnoredFile = path.join(tempDir, 'test.log');
        const nestedDir = path.join(tempDir, 'nested');
        const nestedIgnoredFile = path.join(nestedDir, 'ignored-nested.txt');
        
        fs.mkdirSync(nestedDir);
        fs.writeFileSync(normalFile, 'content');
        fs.writeFileSync(ignoredFile, 'content');
        fs.writeFileSync(anotherIgnoredFile, 'content');
        fs.writeFileSync(nestedIgnoredFile, 'content');
        
        const files = await getFilesToConcat(
            [tempDir], 
            { ignores: ['ignored*.txt', '*.log'] }
        );
        
        // Verify results
        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(normalFile));
        assert.ok(!files.includes(ignoredFile));
        assert.ok(!files.includes(anotherIgnoredFile));
        assert.ok(!files.includes(nestedIgnoredFile));
    });

    test('should work with all options combined', async function () {
        // Create different types of files
        // 1. Normal file
        const normalFile = path.join(tempDir, 'normal.txt');

        // 2. Hidden files
        const hiddenFile = path.join(tempDir, '.hidden.txt');
        const hiddenIgnoredByCustomRule = path.join(tempDir, '.config.json');

        // 3. Files in nested directories
        const nestedDir = path.join(tempDir, 'nested');
        fs.mkdirSync(nestedDir);
        const nestedNormalFile = path.join(nestedDir, 'nested-normal.txt');
        const nestedIgnoredByGit = path.join(nestedDir, 'ignored-by-git.txt');

        // 4. Files ignored by gitignore
        const ignoredByGit = path.join(tempDir, 'ignored-by-git.txt');
        
        // 5. Files ignored by custom rules
        const ignoredByCustomRule = path.join(tempDir, 'temp.log');
        const anotherIgnoredByCustom = path.join(tempDir, 'ignored-custom.txt');

        // 6. git ignore file
        const gitIgnoreFile = path.join(tempDir, '.gitignore');

        // Write file contents
        fs.writeFileSync(normalFile, 'content');
        fs.writeFileSync(hiddenFile, 'content');
        fs.writeFileSync(hiddenIgnoredByCustomRule, 'content');
        fs.writeFileSync(nestedNormalFile, 'content');
        fs.writeFileSync(nestedIgnoredByGit, 'content');
        fs.writeFileSync(ignoredByGit, 'content');
        fs.writeFileSync(ignoredByCustomRule, 'content');
        fs.writeFileSync(anotherIgnoredByCustom, 'content');
        fs.writeFileSync(gitIgnoreFile, 'ignored-by-git.txt\n');

        // Test scenario 1: Default options - exclude hidden files, respect gitignore rules
        let files = await getFilesToConcat([tempDir]);
        assert.ok(files.includes(normalFile));
        assert.ok(files.includes(nestedNormalFile));
        assert.ok(files.includes(ignoredByCustomRule));
        assert.ok(files.includes(anotherIgnoredByCustom));
        assert.strictEqual(files.length, 4);

        // Test scenario 2: Include hidden files, but still respect gitignore rules
        files = await getFilesToConcat([tempDir], { includeHidden: true });
        assert.ok(files.includes(hiddenFile));
        assert.ok(files.includes(hiddenIgnoredByCustomRule));
        assert.ok(files.includes(gitIgnoreFile));
        assert.strictEqual(files.length, 7);

        // Test scenario 3: Ignore gitignore rules, but exclude hidden files
        files = await getFilesToConcat([tempDir], { ignoreGit: true });
        assert.ok(files.includes(normalFile));
        assert.ok(files.includes(nestedNormalFile));
        assert.ok(files.includes(nestedIgnoredByGit));
        assert.ok(files.includes(ignoredByGit));
        assert.ok(files.includes(ignoredByCustomRule));
        assert.ok(files.includes(anotherIgnoredByCustom));
        assert.strictEqual(files.length, 6);

        // Test scenario 4: Use custom ignore rules
        files = await getFilesToConcat([tempDir], { 
            ignores: ['*.log', 'ignored-custom.txt'] 
        });
        assert.ok(files.includes(normalFile));
        assert.ok(files.includes(nestedNormalFile));
        assert.strictEqual(files.length, 2);

        // Test scenario 5: Combine all options
        files = await getFilesToConcat([tempDir], {
            includeHidden: true,
            ignoreGit: true,
            ignores: ['*.log', '*.json', 'ignored-custom.txt']
        });
        assert.ok(files.includes(normalFile));
        assert.ok(files.includes(nestedNormalFile));
        assert.ok(files.includes(hiddenFile));
        assert.ok(files.includes(ignoredByGit));
        assert.ok(files.includes(nestedIgnoredByGit));
        assert.ok(files.includes(gitIgnoreFile));
        assert.strictEqual(files.length, 6);
    });

    test('bugfix: package-lock.json should be ignored', async function () {
        const dir = path.join(tempDir, 'hello');
        const packageFile = path.join(dir, 'package.json');
        const packageLockFile = path.join(dir, 'package-lock.json');

        fs.mkdirSync(dir);
        fs.writeFileSync(packageFile, 'content');
        fs.writeFileSync(packageLockFile, 'content');

        const files = await getFilesToConcat([tempDir], {
            ignores: ['package-lock.json']
        });

        assert.strictEqual(files.length, 1);
        assert.ok(files.includes(packageFile));
    });
});
