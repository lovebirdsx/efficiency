import * as vscode from 'vscode';
import { askChatGptTalk, askChatGptTalkMini, askChatGptReasoner, askChatGptReasonerMini, askDeepSeekReasoner, askDeepSeekTalk, convertToChinesePunctuation, convertToEnglishPunctuation, createMergeConfig, generateMarkdownTable, mergePaths } from './commands';

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
	registerCommand('efficiency.askChatGptTalk', askChatGptTalk);
	registerCommand('efficiency.askChatGptTalkMini', askChatGptTalkMini);
	registerCommand('efficiency.askChatGptReasoner', askChatGptReasoner);
	registerCommand('efficiency.askChatGptReasonerMini', askChatGptReasonerMini);
}

export function deactivate() {}
