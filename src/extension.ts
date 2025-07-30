import * as vscode from 'vscode';
import { convertToChinesePunctuation, convertToEnglishPunctuation, createMergeConfig, execShellCommand, generateMarkdownTable, mergePaths, openExternalShellByWorkspaceFolder, openExternalShellFromActiveFile, showCustomShellCommandList } from './commands';
import { changePathSeparator } from './listenners';
import { initLog, showOutput } from './log';

export function activate(context: vscode.ExtensionContext) {
	initLog(context);

	function registerCommand(name: string, callback: (...args: any[]) => any, thisArg?: any): void {
		const disposable = vscode.commands.registerCommand(name, callback, thisArg);
		context.subscriptions.push(disposable);
	}

	registerCommand('efficiency.showOutput', showOutput);
	registerCommand('efficiency.openExternalShellByWorkspaceFolder', openExternalShellByWorkspaceFolder);
	registerCommand('efficiency.openExternalShellByCurrentFile', openExternalShellFromActiveFile);
	registerCommand('efficiency.execShellCommand', execShellCommand);
	registerCommand('efficiency.showCustomShellCommandList', () => showCustomShellCommandList(context));
	registerCommand('efficiency.convertToEnglishPunctuation', convertToEnglishPunctuation);
	registerCommand('efficiency.convertToChinesePunctuation', convertToChinesePunctuation);
	registerCommand('efficiency.generateMarkdownTable', generateMarkdownTable);
	registerCommand('efficiency.createMergeConfig', createMergeConfig);
	registerCommand('efficiency.mergePaths', () => mergePaths(context));

	function registerListeners(listener: () => { dispose: () => void}) {
		const disposable = listener();
		context.subscriptions.push(disposable);
	}

	registerListeners(changePathSeparator);
}

export function deactivate() { }
