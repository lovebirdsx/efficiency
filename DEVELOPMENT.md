# Development

* Setup: `yarn install`
* Test: `yarn test`
* Package: `vsce package`
* Publish: `vsce publish`

## vscode settings

* launch `Run Extension` to debug the extension
* Test can only recognize `out` folder, so before run test by extension `Extension Test Runner`, you need to run `yarn watch-tests` to compile the test code to `out` folder.
