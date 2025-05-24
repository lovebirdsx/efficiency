# README

Some useful functions for efficiency.

## 1. English & Chinese Punctuation

* `Efficiency: Convert To English Punctuation`: Converts all punctuation to English punctuation
* `Efficiency: Convert To Chinese Punctuation`: Converts all punctuation to Chinese punctuation

## 2. Markdown Helper

* `Efficiency: Generate Markdown Table`: 

Convert selected text to a Markdown table or generate a default table. e.g.,
Select Text `Name, Age` will change it to the following:

``` text
| Name | Age |
| ---- | --- |
|      |     |
```

## 3. File Merge

* Merge multiple files into one file, which is useful for providing context for Ask AI.
* Combined with this Google Chrome extension [chatgpt-cli-extension](https://github.com/lovebirdsx/chatgpt-cli-extension) to query ChatGPT with multiple files.

**Settings:**

* `efficiency.openAfterMerge`: Open the merged file after merging; default is `true`
* `efficiency.shellAfterMerge`: Shell to execute after merging paths. Leave empty to disable. `${file}` will be replaced with the merged file path.

**Commands:**

* `Efficiency: Create Merge Config File`: Create a merge configuration file for the `Merge Paths To Single File` command.
* `Efficiency: Merge Paths To Single File`: Merge all paths in the configuration file into a single file.

## 4. Misc

### 4.1. Open External Shell

**Settings:**

* `efficiency.defaultShell`: Default shell command to open an external terminal; default is `sh.exe --login -i`

**Commands:**

* `efficiency.openExternalShellByWorkspaceFolder`: Open an external shell by workspace folder
* `efficiency.openExternalShellByCurrentFile`: Open an external shell by current file

### 4.2. Execute Shell Command

Bind a shell command to a keybinding, for example:

```json
{
  "key": "alt+shift+1",
  "command": "efficiency.execShellCommand",
  "args": {
    "silent": true,
    "shell": "echo ${file}"
  }
}
```

Supported variables:

| Name                         | Description                                  |
| ---------------------------- | -------------------------------------------- |
| `${workspaceFolder}`         | The workspace folder of the current file     |
| `${file}`                    | The current file path                        |
| `${fileDirname}`             | The current file’s directory                 |
| `${fileBasename}`            | The current file name                        |
| `${fileBasenameNoExtension}` | The current file name without extension      |
| `${selectionFile}`           | The file which contains the selected text    |
| `${selection}`               | The selected text or the text expanded at cursor |

### 4.3. Auto Change Windows Path Separator

Automatically change the Windows path separator when pasting paths.

**Settings:**

* `efficiency.pastePathConvert.enabled`: Enable automatic change of the path separator when pasting paths; default is `true`

### 4.4. Custom Shell Command List

* Configure `efficiency.customShellCommands` in settings. Example:

```jsonc
"efficiency.customShellCommands": [
  {
    "name": "Open Notepad",
    "description": "Open Notepad",
    "shell": "notepad.exe",
    "silent": true
  },
  {
    "name": "Open Shell by Current Workspace Folder",
    "description": "Open shell by current workspace folder",    
    "shell": "pwsh.exe -NoLogo -Command \"cd ${workspaceFolder};\"",
  }
]
```

* Run command: `Efficiency: Show Custom Shell Command List`
