import * as vscode from 'vscode';
import { convertToChinesePunctuation, convertToEnglishPunctuation, createMergeConfig, generateMarkdownTable, mergePaths, openExternalShellByWorkspaceFolder, openExternalShellFromActiveFile } from './commands';
import { changePathSeparator } from './listenners';

export function activate(context: vscode.ExtensionContext) {
	function registerCommand(name: string, callback: (...args: any[]) => any, thisArg?: any): void {
		const disposable = vscode.commands.registerCommand(name, callback, thisArg);
		context.subscriptions.push(disposable);
	}

	registerCommand('efficiency.openExternalShellByWorkspaceFolder', openExternalShellByWorkspaceFolder);
	registerCommand('efficiency.openExternalShellByCurrentFile', openExternalShellFromActiveFile);
	registerCommand('efficiency.convertToEnglishPunctuation', convertToEnglishPunctuation);
	registerCommand('efficiency.convertToChinesePunctuation', convertToChinesePunctuation);
	registerCommand('efficiency.generateMarkdownTable', generateMarkdownTable);
	registerCommand('efficiency.createMergeConfig', createMergeConfig);
	registerCommand('efficiency.mergePaths', mergePaths);

	function registerListeners(listener: () => { dispose: () => void}) {
		const disposable = listener();
		context.subscriptions.push(disposable);
	}

	registerListeners(changePathSeparator);
}

export function deactivate() { }
