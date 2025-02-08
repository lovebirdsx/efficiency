import * as vscode from 'vscode';
import { askAiumGpt4o, askAiumGpt4oMini, askAiumO1, askAiumO1Mini, askDeepSeekReasoner, askDeepSeekTalk, convertToChinesePunctuation, convertToEnglishPunctuation, createMergeConfig, generateMarkdownTable, mergePaths } from './commands';

export function activate(context: vscode.ExtensionContext) {
	function registerCommand(name: string, callback: (...args: any[]) => any, thisArg?: any): void {
		const disposable = vscode.commands.registerCommand(name, callback, thisArg);
		context.subscriptions.push(disposable);
	}

	registerCommand('efficiency.convertToEnglishPunctuation', convertToEnglishPunctuation);
	registerCommand('efficiency.convertToChinesePunctuation', convertToChinesePunctuation);
	registerCommand('efficiency.generateMarkdownTable', generateMarkdownTable);
	registerCommand('efficiency.createMergeConfig', createMergeConfig);
	registerCommand('efficiency.mergePaths', mergePaths);

	registerCommand('efficiency.askDeepSeekTalk', askDeepSeekTalk);
	registerCommand('efficiency.askDeepSeekReasoner', askDeepSeekReasoner);
	registerCommand('efficiency.askAiumGpt4o', askAiumGpt4o);
	registerCommand('efficiency.askAiumGpt4oMini', askAiumGpt4oMini);
	registerCommand('efficiency.askAiumO1', askAiumO1);
	registerCommand('efficiency.askAiumO1Mini', askAiumO1Mini);
}

export function deactivate() {}
