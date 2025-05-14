import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

import { PunctuationConverter } from './common/punctuationConverter';
import { Markdown } from './common/markdown';
import { concatTextFiles } from './common/fileMerger';
import { askAi } from './common/ai';

function openExternalShellByDir(dir: string) {
    const shell = vscode.workspace.getConfiguration('efficiency').get('defaultShell') as string;
    if (!shell) {
        vscode.window.showInformationMessage('Please set the default shell path in the settings!');
        return;
    }

    spawn(shell, { cwd: dir, detached: true, shell: true,}).unref();
}

export function openExternalShellByWorkspaceFolder() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showInformationMessage('No workspace is opened!');
        return;
    }
    
    openExternalShellByDir(vscode.workspace.workspaceFolders[0].uri.fsPath);
}

export function openExternalShellFromActiveFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor!');
        return;
    }
    
    const dir = path.dirname(editor.document.uri.fsPath);
    openExternalShellByDir(dir);
}

function convert(lang: 'en' | 'zh') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const text = selection.isEmpty ? document.getText() : document.getText(selection);

    let text1: string;
    if (lang === 'en') {
        text1 = PunctuationConverter.toEnglish(text);
    } else {
        text1 = PunctuationConverter.toChinese(text);
    }

    editor.edit(editBuilder => {
        if (selection.isEmpty) {
            const lastLine = document.lineAt(document.lineCount - 1);
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
            const range = new vscode.Range(start, end);
            editBuilder.replace(range, text1);
            return;
        }

        editBuilder.replace(selection, text1);
    });
}

export function convertToEnglishPunctuation() {
    convert('en');
}

export function convertToChinesePunctuation() {
    convert('zh');
}

/**
 * Convert selected text to a Markdown table or generate a default table.
 */
export function generateMarkdownTable() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showInformationMessage('No active editor!');
        return;
    }

    let selection = editor.selection;
    let text = editor.document.getText(selection).trim();

    let columnNames = [];

    if (text === '') {
        columnNames = ["Colume1", "Colume2", "Colume3"];
    } else {
        // split by comma, space or tab
        columnNames = text.split(/[\s,]+/);
    }

    const markdownTable = Markdown.generateMarkdownTable(columnNames);

    editor.edit((editBuilder) => {
        editBuilder.replace(selection, markdownTable);
    });
}

interface IMergeFileOptions {
    type: 'mergeFile';
    paths: string[];
    output: string;
    ignoreGit?: boolean;
    includeHidden?: boolean;
}

export function createMergeConfig() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is opened!');
        return;
    }

    const currentWorkspace = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(currentWorkspace, 'mergePathsConfig.json');

    if (vscode.workspace.textDocuments.some(doc => doc.fileName === filePath)) {
        vscode.window.showInformationMessage('The file already exists!');
        return;
    }

    if (fs.existsSync(filePath)) {
        vscode.window.showInformationMessage('The file already exists!');
        return;
    }

    const defalutConfig: IMergeFileOptions = {
        type: 'mergeFile',
        paths: [],
        output: '',
        ignoreGit: false,
        includeHidden: false,
    };
    fs.writeFileSync(filePath, JSON.stringify(defalutConfig, null, 4));
}

/**
 * Merge multiple paths into a single output file.
 */
export async function mergePaths() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor!');
        return;
    }

    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is opened!');
        return;
    }

    try {
        const options = JSON.parse(editor.document.getText()) as IMergeFileOptions;
        if (!(options.paths instanceof Array)) {
            vscode.window.showErrorMessage('Invalid paths!');
            return;
        }

        if (typeof options.output !== 'string') {
            vscode.window.showErrorMessage('Invalid output!');
            return;
        }

        const currentWorkspace = vscode.workspace.workspaceFolders![0].uri.fsPath;
        const paths = options.paths.map(p => {
            if (!path.isAbsolute(p)) {
                return path.join(currentWorkspace, p);
            }
            return p;
        });

        const output = path.isAbsolute(options.output) ? options.output : path.join(currentWorkspace, options.output);

        await concatTextFiles(paths, output);

        const uri = vscode.Uri.file(output);
        await vscode.commands.executeCommand('vscode.open', uri);
    } catch (error) {
        vscode.window.showErrorMessage('Merge failed: ' + error);
        return;
    }
}

/**
 * 如果有选中内容，则直接使用；否则，从当前光标所在行开始，
 * 向上和向下扩展直到遇到空行，把这部分文本作为问题，同时返回该文本在文档中的范围。
 */
async function getQuestionAndRange(editor: vscode.TextEditor): Promise<{ question: string, range: vscode.Range }> {
    const document = editor.document;
    const selection = editor.selection;

    if (!selection.isEmpty) {
        return { question: document.getText(selection), range: selection };
    } else {
        let startLine = selection.active.line;
        let endLine = selection.active.line;

        // 向上扩展，直到遇到空行或到达文档开头
        while (startLine > 0) {
            const prevLineText = document.lineAt(startLine - 1).text;
            if (prevLineText.trim() === '') {
                break;
            }
            startLine--;
        }
        // 向下扩展，直到遇到空行或到达文档末尾
        while (endLine < document.lineCount - 1) {
            const nextLineText = document.lineAt(endLine + 1).text;
            if (nextLineText.trim() === '') {
                break;
            }
            endLine++;
        }
        const startPos = new vscode.Position(startLine, 0);
        const endPos = document.lineAt(endLine).range.end;
        const range = new vscode.Range(startPos, endPos);
        const question = document.getText(range);
        return { question, range };
    }
}

/**
 * 将给定的文本插入到指定位置，并返回插入后的位置。
 */
async function appendText(editor: vscode.TextEditor, insertionPos: vscode.Position, text: string): Promise<vscode.Position> {
    const realText = text.replace(/\r\n/g, '\n');

    await editor.edit(
        editBuilder => { editBuilder.insert(insertionPos, realText); },
        { undoStopBefore: false, undoStopAfter: false }
    );

    const eol = editor.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
    const adjustedText = realText.replace(/\n/g, eol);
    const startOffset = editor.document.offsetAt(insertionPos);

    return editor.document.positionAt(startOffset + adjustedText.length);
}

export interface AskAiBySelectionOptions {
    apiKeyInConfiguireName: string;
    baseUrlInConfiguireName: string;
    modelInConfiguireName: string;
}

/**
 * 根据当前的选中或扩展后的文本，调用 DeepSeek API 并以流式的方式逐字显示返回结果。
 */
async function askAiBySelection(options: AskAiBySelectionOptions) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor!');
        return;
    }

    // 获取问题文本和对应区域（如果未选中，则进行上下扩展）
    const { question, range } = await getQuestionAndRange(editor);

    if (question.trim() === '') {
        vscode.window.showInformationMessage('No question found!');
        return;
    }

    const apiKey = vscode.workspace.getConfiguration('efficiency').get(options.apiKeyInConfiguireName) as string;
    if (!apiKey) {
        vscode.window.showInformationMessage(`Please set the API key {efficiency.${options.apiKeyInConfiguireName}} in the settings!`);
        return;
    }

    const baseUrl = vscode.workspace.getConfiguration('efficiency').get(options.baseUrlInConfiguireName) as string;
    const model = vscode.workspace.getConfiguration('efficiency').get(options.modelInConfiguireName) as string;
    let insertionPos = range.end;
    try {
        vscode.window.setStatusBarMessage(`Asking ${baseUrl} mode: ${model}...`, 50 * 1000);
        let messageArrived = false;
        await askAi({ baseUrl, question, apiKey, model }, async (chunk: string) => {
            if (!messageArrived) {
                messageArrived = true;
                vscode.window.setStatusBarMessage('');

                // 确定答案插入位置：在问题区域的末尾，如果当前行非空则先插入换行符
                const currentLine = editor.document.lineAt(insertionPos);
                if (currentLine.text.trim() !== '') {
                    await editor.edit(editBuilder => {
                        editBuilder.insert(insertionPos, '\n\n');
                    });
                    insertionPos = new vscode.Position(insertionPos.line + 2, 0);
                }
            }

            insertionPos = await appendText(editor, insertionPos, chunk);
        });
    } catch (error: any) {
        vscode.window.setStatusBarMessage(`Ask ${baseUrl} mode: ${model} failed: ${error}`, 5 * 1000);
        vscode.window.showErrorMessage(`${error}\nAsk ${baseUrl}\n mode: ${model}`);
    }
}

export function askDeepSeekTalk() {
    askAiBySelection({
        apiKeyInConfiguireName: 'deepSeekApiKey',
        baseUrlInConfiguireName: 'deepSeekBaseUrl',
        modelInConfiguireName: 'deepSeekTalkModeId',
    });
}

export function askDeepSeekReasoner() {
    askAiBySelection({
        apiKeyInConfiguireName: 'deepSeekApiKey',
        baseUrlInConfiguireName: 'deepSeekBaseUrl',
        modelInConfiguireName: 'deepSeekReasonerModeId',
    });
}

export function askChatGptTalk() {
    askAiBySelection({
        apiKeyInConfiguireName: 'chatgptApiKey',
        baseUrlInConfiguireName: 'chatgptBaseUrl',
        modelInConfiguireName: 'chatgptTalkModelId',
    });
}

export function askChatGptTalkMini() {
    askAiBySelection({
        apiKeyInConfiguireName: 'chatgptApiKey',
        baseUrlInConfiguireName: 'chatgptBaseUrl',
        modelInConfiguireName: 'chatgptTalkMiniModelId',
    });
}

export function askChatGptReasoner() {
    askAiBySelection({
        apiKeyInConfiguireName: 'chatgptApiKey',
        baseUrlInConfiguireName: 'chatgptBaseUrl',
        modelInConfiguireName: 'chatgptReasonerModelId',
    });
}

export function askChatGptReasonerMini() {
    askAiBySelection({
        apiKeyInConfiguireName: 'chatgptApiKey',
        baseUrlInConfiguireName: 'chatgptBaseUrl',
        modelInConfiguireName: 'chatgptReasonerMiniModelId',
    });
}
