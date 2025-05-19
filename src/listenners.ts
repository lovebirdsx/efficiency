import * as vscode from 'vscode';

function isWindowsPath(s: string): boolean {
    if (s.includes('\n') || s.trim().length === 0) {
        return false;
    }
    
    // remove quotes
    s = s.replace(/^['"]|['"]$/g, '');

    const driveLetter = /^[a-zA-Z]:[\\/]/.test(s);
    const uncShare = /^\\\\[^\\]/.test(s);
    return (driveLetter || uncShare) && s.includes('\\');
}

export function changePathSeparator() {
    let skipNext = false;
    return vscode.workspace.onDidChangeTextDocument(event => {
        if (event.reason === vscode.TextDocumentChangeReason.Undo) {
            return;
        }

        if (skipNext) {
            skipNext = false;
            return;
        }
        
        const config = vscode.workspace.getConfiguration('efficiency').get<boolean>('pastePathConvert.enabled');
        if (!config) {
            return;
        }


        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== event.document.uri.toString()) {
            return;
        }

        if (event.contentChanges.length !== 1) {
            return;
        }

        const change = event.contentChanges[0];
        const text = change.text;

        if (isWindowsPath(text)) {
            const converted = text.replace(/(\\+)/g, '/');
            skipNext = true;
            editor.edit(editBuilder => {
                const startPos = change.range.start;
                const endPos = startPos.translate(0, text.length);
                const replaceRange = new vscode.Range(startPos, endPos);
                editBuilder.replace(replaceRange, converted);
            });
        }
    });
}