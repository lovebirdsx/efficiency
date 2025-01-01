import * as fs from 'fs/promises';
import * as assert from 'assert';

import { PunctuationConverter } from "../common/punctuationConverter";

suite('Punctuation Converter Tests', function () {
    setup(async function () {
        await fs.mkdir("tmp", { recursive: true });
    });

    test('should convert Chinese punctuation to English', function () {
        assert.equal(PunctuationConverter.toEnglish("你好，世界！"), "你好,世界!");
        assert.equal(PunctuationConverter.toEnglish("你好。"), "你好.");
        assert.equal(PunctuationConverter.toEnglish("你‘好’，“世界”！"), "你'好',\"世界\"!");
    });

    test('should convert English punctuation to Chinese', function () {
        assert.equal(PunctuationConverter.toChinese("Hello,world!"), "Hello，world！");
        assert.equal(PunctuationConverter.toChinese("你好."), "你好。");
        assert.equal(PunctuationConverter.toChinese("你'好',\"世界\"!"), "你‘好’，“世界”！");
    });

    test('should convert punctuation in a file to English', async function () {
        const file = "tmp/test_punctuation_converter_to_english.txt";
        await fs.writeFile(file, Buffer.from("你好，世界！\n你‘好’，“世界”！", 'utf8'));

        await PunctuationConverter.toEnglishFile(file);
        const output = (await fs.readFile(file)).toString();
        assert.equal(output, "你好,世界!\n你'好',\"世界\"!");
    });

    test('should convert punctuation in a file to Chinese', async function () {
        const file = "tmp/test_punctuation_converter_to_chinese.txt";
        await fs.writeFile(file, Buffer.from("Hello,world!\n你‘好’，“世界”！", 'utf8'));

        await PunctuationConverter.toChineseFile(file);
        const output = (await fs.readFile(file)).toString();
        assert.equal(output, "Hello，world！\n你‘好’，“世界”！");
    });
});
