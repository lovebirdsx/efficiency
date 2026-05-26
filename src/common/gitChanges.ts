import * as vscode from 'vscode';
import { warn } from '../log';

interface Change {
    readonly uri: vscode.Uri;
    readonly originalUri: vscode.Uri;
    readonly renameUri?: vscode.Uri;
    readonly status: number;
}

interface RepositoryState {
    readonly mergeChanges: Change[];
    readonly indexChanges: Change[];
    readonly workingTreeChanges: Change[];
}

interface Repository {
    readonly state: RepositoryState;
}

interface GitAPI {
    readonly repositories: Repository[];
}

interface GitExtension {
    getAPI(version: 1): GitAPI;
}

async function getGitAPI(): Promise<GitAPI | undefined> {
    const ext = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (!ext) {
        return undefined;
    }
    if (!ext.isActive) {
        await ext.activate();
    }
    return ext.exports.getAPI(1);
}

export async function collectAllChanges(): Promise<Change[]> {
    try {
        const git = await getGitAPI();
        if (!git) {
            return [];
        }
        const all: Change[] = [];
        const seen = new Set<string>();
        for (const repo of git.repositories) {
            const groups = [
                repo.state.mergeChanges,
                repo.state.indexChanges,
                repo.state.workingTreeChanges,
            ];
            for (const group of groups) {
                for (const change of group) {
                    const key = change.uri.fsPath;
                    if (seen.has(key)) {
                        continue;
                    }
                    seen.add(key);
                    all.push(change);
                }
            }
        }
        return all;
    } catch (e) {
        warn('collectAllChanges failed:', String(e));
        return [];
    }
}

export function openChange(uri: vscode.Uri): Thenable<unknown> {
    return vscode.commands.executeCommand('git.openChange', uri);
}
