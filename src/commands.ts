import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { PunctuationConverter } from './common/punctuationConverter';
import { Markdown } from './common/markdown';
import { concatTextFiles } from './common/fileMerger';

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
    type: 'mergeFile',
    paths: string[],
    output: string,
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
        output: ''
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