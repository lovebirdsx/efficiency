# README

Some useful functions for efficiency.

## 1. Ask Ai In Document

### 1.1. Usage

* Update the settings for the ai you want to use.
* Select the text in active text document you want to ask the ai.
* Run the ask ai command.
* Answer will be shown below the selected text.

### 1.2. Settings

**DeepSeek**

* Settings:
    * `efficiency.deepSeekApiKey`, default is empty
    * `efficiency.deepSeekBaseUrl`, default is `https://api.deepseek.ai`
    * `efficiency.deepSeekTalkModeId`, default is `deepseek-chat`
    * `efficiency.deepSeekReasonerModeId`, default is `deepseek-reasoner`
* Commands:
    * `efficiency.askDeepSeekTalk`
    * `efficiency.askDeepSeekReasoner`

**ChatGPT**

* Settings: 
    * `efficiency.chatgptApiKey`, default is empty
    * `efficiency.chatgptBaseUrl`, default is `https://aium.cc/v1/`
    * `efficiency.chatgptTalkModeId`, default is `gpt-4o`
    * `efficiency.chatgptTalkMiniModeId`, default is `gpt-4o-mini`
    * `efficiency.chatgptReasonerModeId`, default is `gpt-o1`
    * `efficiency.chatgptReasonerMiniModeId`, default is `gpt-o1-mini`
* Commands:
    * `efficiency.askChatGptTalk`
    * `efficiency.askChatGptTalkMini`
    * `efficiency.askChatGptReasoner`
    * `efficiency.askChatGptReasonerMini`

## 2. English & Chinese Punctuation

* `Efficiency: Convert To English Punctuation`: Converts all punctuation to English punctuation
* `Efficiency: Convert To Chinese Punctuation`: Converts all punctuation to Chinese punctuation

## 3. Markdown Helper

* `Efficiency: Generate Markdown Table`: 

Convert selected text to a Markdown table or generate a default table. eg.
Select Text `Name, Age`, Will change to below
``` text
| Name | Age |
| ---- | --- |
|      |     |
```

## 4. File Merge

* `Efficiency: Create Merge Config File`: Create a merge config file for the `Merge Paths To Single File` command.
* `Efficiency: Merge Paths To Single File`: Merge all paths in the config file to a single file.
