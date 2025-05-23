import * as vscode from 'vscode';

let log: vscode.LogOutputChannel | undefined;
export function initLog(context: vscode.ExtensionContext): void {
    log = vscode.window.createOutputChannel('Efficiency', { log: true });
    context.subscriptions.push(log);
}

export function showOutput(): void {
    if (log) {
        log.show();
    }
}

export function info(...args: unknown[]): void {
    if (log) {
        log.info(args.join(' '));
    } else {
        console.log(args.join(' '));
    }
}

export function warn(...args: unknown[]): void {
    if (log) {
        log.warn(`Warning: ${args.join(' ')}`);
    } else {
        console.warn(args.join(' '));
    }
}

export function error(...args: unknown[]): void {
    if (log) {
        log.error(`Error: ${args.join(' ')}`);
    } else {
        console.error(args.join(' '));
    }
}
