# README

Some useful functions for efficiency.

## 1. English & Chinese Punctuation

* `Efficiency: Convert To English Punctuation`: Converts all punctuation to English punctuation
* `Efficiency: Convert To Chinese Punctuation`: Converts all punctuation to Chinese punctuation

## 2. Markdown Helper

* `Efficiency: Generate Markdown Table`: 

Convert selected text to a Markdown table or generate a default table. eg.
Select Text `Name, Age`, Will change to below

``` text
| Name | Age |
| ---- | --- |
|      |     |
```

## 3. File Merge

* Merge multiple files into one file, which is useful for making context for ask ai.
* Combine use with this google chrome extension [chatgpt-cli-extension](https://github.com/lovebirdsx/chatgpt-cli-extension) to ask chatgpt with multiple files.

**Settings:**

* `efficiency.openAfterMerge`: Open the merged file after merging, default is `true`
* `efficiency.shellAfterMerge`: Shell to execute after merging paths. Leave empty to disable. ${file} will be replaced with the merged file path.

**Commands:**

* `Efficiency: Create Merge Config File`: Create a merge config file for the `Merge Paths To Single File` command.
* `Efficiency: Merge Paths To Single File`: Merge all paths in the config file to a single file.

## 4. Misc

### 4.1. Open External Shell

**Settings:**

* `efficiency.defaultShell`: Default shell command to open external terminal, default is `sh.exe --login -i`

**Commands:**

* `efficiency.openExternalShellByWorkspaceFolder`: Open external shell by workspace folder
* `efficiency.openExternalShellByCurrentFile`: Open external shell by current file

### 4.2. Excute Shell Command

Bind a shell command to a keybinding. like: 

```json
{
  "key": "alt+shift+1",
  "command": "efficiency.execShellCommand",
  "args": {
    "silent": true,
    "shell": "echo ${file}",
  }
}
```

supported variables:

| name                         | description                                  |
| ---------------------------- | -------------------------------------------- |
| `${workspaceFolder}`         | The workspace folder of the current file     |
| `${file}`                    | The current file path                        |
| `${fileDirname}`             | The current file directory                   |
| `${fileBasename}`            | The current file name                        |
| `${fileBasenameNoExtension}` | The current file name without extension      |
| `${selectionFile}`           | The file which contains the selected text    |
| `${selection}`               | The selected text or expanded text at cursor |

### 4.3. Auto Change Windows Path Separator

Automatically change windows path separator when pasting paths.

**Settings:**

* `efficiency.pastePathConvert.enabled`: Enable auto change path separator when pasting paths, default is `true`
