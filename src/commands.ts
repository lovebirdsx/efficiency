import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import JSON5 from 'json5';
import { homedir } from 'os';

import { PunctuationConverter } from './common/punctuationConverter';
import { Markdown } from './common/markdown';
import { concatTextFiles } from './common/fileMerger';
import { error, info, warn } from './log';

function openExternalShellByDir(dir: string) {
    const shell = vscode.workspace.getConfiguration('efficiency').get('defaultShell') as string;
    if (!shell) {
        vscode.window.showInformationMessage('Please set the default shell path in the settings!');
        return;
    }

    spawn(shell, { cwd: dir, detached: true, shell: true, }).unref();
}

function getWorkspaceFolder() {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    return workspaceFolder.uri.fsPath;
}

export function openExternalShellByWorkspaceFolder() {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        vscode.window.showInformationMessage('No workspace is opened!');
        return;
    }

    openExternalShellByDir(workspaceFolder);
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

function replaceShellVariables(shell: string): string {
    if (shell.includes('${workspaceFolder}')) {
        const workspaceFolder = getWorkspaceFolder();
        if (workspaceFolder) {
            shell = shell.replace(/\${workspaceFolder}/g, workspaceFolder);
        } else {
            warn('No workspace folder found!');
        }
    }

    if (shell.includes('${file}') || shell.includes('${fileDirname}') || shell.includes('${fileBasename}') || shell.includes('${fileBasenameNoExtension}')) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            if (shell.includes('${file}')) {
                const file = editor.document.uri.fsPath;
                shell = shell.replace(/\${file}/g, file);
            } else if (shell.includes('${fileDirname}')) {
                const fileDirname = path.dirname(editor.document.uri.fsPath);
                shell = shell.replace(/\${fileDirname}/g, fileDirname);
            } else if (shell.includes('${fileBasename}')) {
                const fileBasename = path.basename(editor.document.uri.fsPath);
                shell = shell.replace(/\${fileBasename}/g, fileBasename);
            } else if (shell.includes('${fileBasenameNoExtension}')) {
                const fileBasenameNoExtension = path.basename(editor.document.uri.fsPath, path.extname(editor.document.uri.fsPath));
                shell = shell.replace(/\${fileBasenameNoExtension}/g, fileBasenameNoExtension);
            }
        } else {
            warn('No active editor!');
        }
    }

    if (shell.includes('${selectionFile}') || shell.includes('${selection}')) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            warn('No active editor!');
        } else {
            const text = getSelectedText(editor);
            if (!text) {
                warn('No text selected!');
            } else {
                if (shell.includes('${selection}')) {
                    shell = shell.replace(/\${selection}/g, text);
                } else {
                    const tempFilePath = path.join(homedir(), '.efficiency.selection.txt');
                    fs.writeFileSync(tempFilePath, text);

                    shell = shell.replace(/\${selectionFile}/g, tempFilePath);
                }
            }
        }
    }

    return shell;
}

function removeEmptyLines(data: string): string {
    return data.replaceAll(/\r\n/g, '\n')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .join('\n');
}

export function execShellCommand(args: { shell: string, silent?: boolean }): void {
    let shell = args.shell;
    if (!shell) {
        vscode.window.showInformationMessage('Please set the shell command in args');
        return;
    }

    shell = replaceShellVariables(shell);
    const cwd = getWorkspaceFolder() ?? process.cwd();
    const child = spawn(shell, { shell: true, windowsHide: args.silent, cwd });
    info(`Executing shell command: ${shell} silent: ${!!args.silent} cwd: ${cwd}`);

    child.stdout.on('data', (data: Buffer) => {
        info(`Shell output: ${removeEmptyLines(data.toString())}`);
    });

    child.on('error', (err) => {
        error(`Shell execution error: ${err.message}`);
        vscode.window.showErrorMessage(`Shell execution error: ${err.message}`);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            error(`Shell exited with code: ${code}`);
            vscode.window.showErrorMessage(`Shell exited with code: ${code}`);
        } else {
            info('Shell executed successfully');
        }
    });
}

function getSelectedText(editor: vscode.TextEditor): string {
    const document = editor.document;
    const selection = editor.selection;
    if (!selection.isEmpty) {
        return document.getText(selection);
    }

    // If no text is selected, expand the selection to the nearest non-empty lines
    let startLine = selection.active.line;
    while (startLine > 0) {
        const prevLineText = document.lineAt(startLine - 1).text;
        if (prevLineText.trim() === '') {
            break;
        }
        startLine--;
    }

    let endLine = selection.active.line;
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

    return document.getText(range);
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
    outputBaseDir?: string;
    output: string;
    ignoreGit?: boolean;
    includeHidden?: boolean;
    ignores?: string[];
    shellAfterMerge?: string;
}

export async function createMergeConfig() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showInformationMessage('No workspace is opened!');
        return;
    }

    // prompt user to input the file name
    const defaultFileName = '.efficiency/mergePathsConfig.json';
    const options: vscode.InputBoxOptions = {
        prompt: 'Enter the file name',
        value: defaultFileName,
        placeHolder: 'File name',
    };

    const fileName = await vscode.window.showInputBox(options);
    if (!fileName) {
        return;
    }

    if (!fileName.endsWith('.json')) {
        vscode.window.showInformationMessage('The file name must end with .json!');
        return;
    }

    const currentWorkspace = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const filePath = path.join(currentWorkspace, fileName);

    if (vscode.workspace.textDocuments.some(doc => doc.fileName === filePath)) {
        vscode.window.showInformationMessage('The file already exists!');
        return;
    }

    if (fs.existsSync(filePath)) {
        vscode.window.showInformationMessage('The file already exists!');
        return;
    }

    // Create the directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Create a JSON5 formatted string with comments
    const configContent = `// Merge file configuration
{
    // Type of operation, must be "mergeFile"
    "type": "mergeFile",

    // Base directory for output files
    // If set, all output file title will be relative to this directory
    "outputBaseDir": "",

    // Array of paths to merge - can be files or directories
    // Paths can be absolute or relative to the workspace
    "paths": [
        // Examples:
        // "src/common",
        // "README.md",
    ],

    // Output file path - can be absolute or relative to the workspace
    "output": "${fileName.replace('.json', '.md')}",

    // Prefix strings to add to combined files
    "prefix": [
        // "You are a professional software engineer.",
    ],

    // Command to run after merging files
    // example: "chatgpt-cli sendMessage \${file}"   
    // \${file} will be replaced with the output file path
    // If this is set, Efficiency.shellAfterMerge will be ignored
    "shellAfterMerge": "",

    // If true, ignore .gitignore rules (default: false)
    "ignoreGit": false,

    // If true, include hidden files starting with '.' (default: false)
    "includeHidden": false,

    // Additional patterns to ignore, similar to .gitignore format
    "ignores": [
        // Examples:
        // "*.log",        // Ignore all log files
        // "temp*.txt",    // Ignore files starting with temp and ending with .txt
        // "**/test/**", // Ignore all test files
    ]
}`;

    fs.writeFileSync(filePath, configContent);

    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc);
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
        const options = JSON5.parse<IMergeFileOptions>(editor.document.getText());
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

        const output = path.isAbsolute(options.output) ? path.resolve(options.output) : path.join(currentWorkspace, options.output);

        if (options.outputBaseDir) {
            if (!path.isAbsolute(options.outputBaseDir)) {
                options.outputBaseDir = path.join(currentWorkspace, options.outputBaseDir);
            }
            options.outputBaseDir = path.resolve(options.outputBaseDir);
        }

        await concatTextFiles(paths, output, options);

        const openAfterMerge = vscode.workspace.getConfiguration('efficiency').get<boolean>('openAfterMerge');
        if (openAfterMerge) {
            const uri = vscode.Uri.file(output);
            await vscode.commands.executeCommand('vscode.open', uri);
        }

        let shellAfterMerge = options.shellAfterMerge;
        if (!shellAfterMerge) {
            shellAfterMerge = vscode.workspace.getConfiguration('efficiency').get<string>('shellAfterMerge');
        }

        if (shellAfterMerge) {
            const realShell = shellAfterMerge.replace(/\${file}/g, output);
            spawn(realShell, { detached: true, shell: true }).unref();
        }
    } catch (error) {
        vscode.window.showErrorMessage('Merge failed: ' + error);
        return;
    }
}

export async function showCustomShellCommandList(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('efficiency');
    const cmds = config.get<{ name: string; description?: string; shell: string; silent?: boolean }[]>('customShellCommands') || [];

    if (cmds.length === 0) {
        vscode.window.showInformationMessage('Please configure efficiency.customShellCommands in settings first');
        return;
    }

    const withTime = cmds.map(cmd => {
        const key = `efficiency.customShellCommands.lastRun.${cmd.name}`;
        const last = context.globalState.get<number>(key, 0);
        return { ...cmd, last };
    });

    withTime.sort((a, b) => b.last - a.last);
    
    const items: vscode.QuickPickItem[] = withTime.map(cmd => ({
        label: cmd.name,
        description: cmd.description || '',
        detail: cmd.shell
    }));

    const pick = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a command to run',
    });

    if (!pick) {
        return;
    }

    const chosen = withTime.find(cmd => cmd.name === pick.label)!;
    execShellCommand({ shell: chosen.shell, silent: chosen.silent });
    
    const now = Date.now();
    await context.globalState.update(
        `efficiency.customShellCommands.lastRun.${chosen.name}`,
        now
    );
}
