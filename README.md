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

Merge multiple files into one file, which is useful for making context for ask ai.

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

### 4.2. Auto Change Windows Path Separator

Automatically change windows path separator when pasting paths.

**Settings:**

* `efficiency.pastePathConvert.enabled`: Enable auto change path separator when pasting paths, default is `true`
