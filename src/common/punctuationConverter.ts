const fs = require('fs').promises; 

const C2E: {[index: string]: string} = {
    "。": ".",
    "、": ",",
    "，": ",",
    "！": "!",
    "？": "?",
    "‘": "'",
    "’": "'",
    "“": '"',
    "”": '"',
    "：": ":",
    "；": ";",
    "（": "(",
    "）": ")",
    "【": "[",
    "】": "]",
    "《": "<",
    "》": ">",
    "——": "--",
    "…": "...",
    "「": "{",
    "」": "}",
    "—": "-",
};

const E2C: {[index: string]: string} = {};
for (let k in C2E) {
    E2C[C2E[k]] = k;
}

export class PunctuationConverter {
    static toEnglish(inputStr: string): string {
        let outputStr = "";
        for (let ch of inputStr) {
            outputStr += C2E[ch] || ch;
        }
        return outputStr;
    }
    
    static toChinese(inputStr: string): string {
        let singleQuoteCounter = 0;
        let doubleQuoteCounter = 0;
        let res: string[] = [];
        for (let char of inputStr) {
            if (char === "\"") {
                doubleQuoteCounter++;
                res.push(doubleQuoteCounter % 2 === 1 ? "“" : "”");
            } else if (char === "\'") {
                singleQuoteCounter++;
                res.push(singleQuoteCounter % 2 === 1 ? "‘" : "’");
            } else {
                res.push(E2C[char] || char);
            }
        }
        return res.join('');
    }
    
    static async toEnglishFile(inputFile: string, outputFile?: string) {
        let inputStr = await fs.readFile(inputFile, 'utf-8');
        let outputStr = PunctuationConverter.toEnglish(inputStr);
        outputFile = outputFile || inputFile;
        await fs.writeFile(outputFile, outputStr, 'utf-8');
    }

    static async toChineseFile(inputFile: string, outputFile?: string) {
        let inputStr = await fs.readFile(inputFile, 'utf-8');
        let outputStr = PunctuationConverter.toChinese(inputStr);
        outputFile = outputFile || inputFile;
        await fs.writeFile(outputFile, outputStr, 'utf-8');
    }
}
