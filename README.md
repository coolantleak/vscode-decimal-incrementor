# Changes

This is a fork of 
https://github.com/nmsmith22389/vscode-incrementor

- Fixed scales (one, tenth, ten) were replaced by configurable generic scales (small, medium, big)
- Limits for each scale were virtually removed

The motivation for this fork is being able to use this extension for GLSL shader development where decimal unrestricted values needed to be supported

# **Incrementor** *(VSCode Extension)*

> Increment or decrement just about anything!

![Demo](images/demo-main.gif)

## Contents
* [Features](#features)
  * [Numbers](#numbers)
  * [Enumerators](#enumerators)
  * [Multiple Selections](#multiple-selections)
* [Usage](#usage)
  * [Available Commands](#available-commands)
* [Extension Settings](#extension-settings)
  * [Keybindings](#keybindings)
* [Known Issues](#known-issues)
* [Change Log](#change-log)


## Features

### Numbers

![Numbers](images/demo-number.gif)

Numbers can be incremented or decremented by any value, configurable via `settings.json`. This works with integers, decimals, and negatives alike. The only *real* condition is that it is a **finite** number.

### Enumerators

![Enumerators](images/demo-enumerator.gif)

Enumerators can basically be any kind of text, like a variable or function or command.

**They can only contain letters, numbers and dashes and must start with a letter and can't end with a dash.**

In the extension settings you can add an array of strings that you want to cycle through. *i.e.* `["false", "true"]`

Each array will cycle through the containing strings from beginning to end and also loop back around if you have the option set. Each array is considered a separate enumerator so `"false"` can only become `"true"` and vice versa depending what the array contains.

### Multiple Selections

![Multiple Selections](images/demo-multiple-selections.gif)

Incrementor supports multiple selections, even in the same line. They do not all have to be the same type, so one selection/cursor could be a number and another could be an enumerator.

## Usage

> **TIP:** Incrementing/decrementing can work with one or multiple cursors.<br>If there are no selections Incrementor will use the word under the caret(s) then select them.

For this example we will be incrementing a number.

1) Either select the number you wish to increment or just place the caret inside or next to the number.

2) Then, either press the hotkey that corresponds to the value you wish to increment by or open the Command Palette and use the command `Incrementor: Increment by X`.

3) Congratulations! You just **Incrementored** your first number!

### Available Commands

*In the Command Palette (Cmd+Shift+P)*

* `Incrementor: Increment (Small)`
* `Incrementor: Decrement (Small)`
* `Incrementor: Increment (Medium)`
* `Incrementor: Decrement (Medium)`
* `Incrementor: Increment (Big)`
* `Incrementor: Decrement (Big)`

## Extension Settings

### `incrementor.enabled`

Enables or disables Incrementor.

* **Default:** true
* **Must be:** Boolean

### `incrementor.inc*` and `incrementor.dec*`

Increment a value under the cursor.
There are 3 configurable scales mapped to keyboard shortcuts (see keybindings)

* **Small** defaults to 0.01
* **Medium** defaults to 0.10
* **Big** defaults to 1.00

### `incrementor.decimalPlaces`

The number of decimal places to round incremented/decremented decimal numbers to.<br>*(a value of 0 will disable rounding)*

* **Default:** 0
* **Must be:** 0 to 10, Integer

### `incrementor.loopEnums`

After reaching the end of an Enum set, start back at the beginning.

* **Default:** true
* **Must be:** Boolean

### `incrementor.enums`

An array of arrays, each containing a list of enums to cycle through.

* **Default:** `[["false", "true"], ["let", "const"]]`
* **Must be:**
  ```
  Array >
    Arrays >
      Strings
  ```

### Keybindings

For now, default keybindings aren't being included but these are the ones I use.

```json
{
  "command": "incrementor.incSmall",
  "key": "ctrl+up"
},
{
  "command": "incrementor.decSmall",
  "key": "ctrl+down"
},
{
  "command": "incrementor.incMedium",
  "key": "ctrl+alt+up"
},
{
  "command": "incrementor.decMedium",
  "key": "ctrl+alt+down"
},
{
  "command": "incrementor.incBig",
  "key": "ctrl+alt+cmd+up"
},
{
  "command": "incrementor.decBig",
  "key": "ctrl+alt+cmd+down"
}
```

## Known Issues

* When using the redo command *(e.g. `cmd+shift+z`)* the selections can get a little wonky. I have no idea why it does that but I am looking for a solution.

    Undo works as expected.

## Change Log

See the changelog [here](CHANGELOG.md).
