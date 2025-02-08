# README

Some useful functions for efficiency.

## Ask Ai In Document

### Usage

* Set the ai api key in the settings.
* Select the text in active text document you want to ask the ai.
* Run the ask ai command.
* Answer will be shown below the selected text.

### Supported AI

**DeepSeek**

* api key: `"efficiency.deepSeekApiKey": "your api key"`
* Commands:
    * `efficiency.askDeepSeekTalk`
    * `efficiency.askDeepSeekReasoner`

**Aium**

* api key: `"efficiency.aiumApiKey": "your api key"`
* Commands:
    * `efficiency.askAiumGpt4o`
    * `efficiency.askAiumGpt4oMini`
    * `efficiency.askAiumO1`
    * `efficiency.askAiumO1Mini`

## English & Chinese Punctuation

* `Efficiency: Convert To English Punctuation`: Converts all punctuation to English punctuation
* `Efficiency: Convert To Chinese Punctuation`: Converts all punctuation to Chinese punctuation

## Markdown Helper

* `Efficiency: Generate Markdown Table`: 

Convert selected text to a Markdown table or generate a default table. eg.
Select Text `Name, Age`, Will change to below
``` text
| Name | Age |
| ---- | --- |
|      |     |
```

## File Merge

* `Efficiency: Create Merge Config File`: Create a merge config file for the `Merge Paths To Single File` command.
* `Efficiency: Merge Paths To Single File`: Merge all paths in the config file to a single file.
