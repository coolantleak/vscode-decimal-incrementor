'use strict';
import * as vscode from 'vscode';
import Range = vscode.Range;
import Selection = vscode.Selection;
import Position = vscode.Position;
import TextEditor = vscode.TextEditor;
import TextEditorEdit = vscode.TextEditorEdit;
import TextDocument = vscode.TextDocument;
// import TextLine = vscode.TextLine;

import * as _ from 'lodash';
import BigNumber from 'bignumber.js';

export function activate(context: vscode.ExtensionContext) {

    const inc = new Incrementor();

    const comIncSmall = vscode.commands.registerCommand('incrementor.incSmall', () => {
        inc.run(inc.action.incSmall);
    });

    const comDecSmall = vscode.commands.registerCommand('incrementor.decSmall', () => {
        inc.run(inc.action.decSmall);
    });

    const comIncMedium = vscode.commands.registerCommand('incrementor.incMedium', () => {
        inc.run(inc.action.incMedium);
    });

    const comDecMedium = vscode.commands.registerCommand('incrementor.decMedium', () => {
        inc.run(inc.action.decMedium);
    });


    const comIncBig = vscode.commands.registerCommand('incrementor.incBig', () => {
        inc.run(inc.action.incBig);
    });

    const comDecBig = vscode.commands.registerCommand('incrementor.decBig', () => {
        inc.run(inc.action.decBig);
    });

    context.subscriptions.push(comIncMedium);
    context.subscriptions.push(comDecMedium);
    context.subscriptions.push(comIncSmall);
    context.subscriptions.push(comDecSmall);
    context.subscriptions.push(comIncBig);
    context.subscriptions.push(comDecBig);
}

/**
 * Extension Class
 */
export class Incrementor {
    /**
     * List of RegEx patterns that match different types of strings.
     *
     * @readonly
     */
    private regex = {
        number:  /^(-?\d+\.?\d*)([a-zA-Z%]*)$/,
        enum:    /^(?:[\w]+-)*[\w]+$/,
        rgb:     /^(rgba(?=\((?:[\s\d]+,){3})|rgb(?!\((?:[\s\d]+,){3}))\(\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d),\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d),\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d)\s*(?:\)|(?:,\s*(1|0?\.\d+|0)\)))$/,
        rgbLine: /(rgba(?=\((?:[\s\d]+,){3})|rgb(?!\((?:[\s\d]+,){3}))\(\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d),\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d),\s*(2[0-5]{2}|1\d{2}|[1-9]\d|\d)\s*(?:\)|(?:,\s*(1|0?\.\d+|0)\)))/,
        hex:     /^#(?:([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})|([A-Fa-f0-9]{3}))$/,
    };

    private vEditor:       TextEditor;
    private edit:          TextEditorEdit;
    private vDoc:          TextDocument;
    private vSel:          Selection[];
    private delta:         number;
    private wordRange:     Range;
    private isReversed:    boolean;
    private wordString:    string;
    private lastRange:     Range;
    private lastValueDiff: number;
    private replaceRanges: Selection[];
    private settings     = vscode.workspace.getConfiguration('incrementor');
    public action = {
        incSmall: 0.01,
        decSmall: -0.01,
        incMedium:   0.10,
        decMedium:   -0.10,
        incBig:   1.00,
        decBig:   -1.00
    };
    private hiddenSels: {
        isOn: boolean;
        pos: Position;
        diff: number;
    };

    // constructor() {
    //     this.updateSettings();
    // }

    // TODO: Consider moving to just functions (not a class) for easier testing in mocha

    /**
     * Run when a command is triggered from the editor.
     * All inc/dec methods are triggered from this method.
     *
     * @param delta The amount to change by.
     *
     *  _(taken from the `this.action` object)_
     */
    run(delta: number) {
        BigNumber.config({ ERRORS: false });

        const action = _.findKey(this.action, (o) => {
            return o === delta;
        });

        this.updateSettings();

        delta = this.action[action];

        this.delta = delta;
        this.lastRange = undefined;
        this.lastValueDiff = undefined;
        this.hiddenSels = {
            isOn: false,
            pos: undefined,
            diff: 0
        };
        this.replaceRanges = [];

        // Iterate through selections.
        this.vEditor.edit((edit) => {
            this.edit = edit;

            for (const sel of this.vSel) {
                this.wordRange = (sel.isEmpty) ? this.vDoc.getWordRangeAtPosition(sel.active) : sel;
                this.wordString = this.vDoc.getText(this.wordRange);
                this.isReversed = (sel.isEmpty) ? false : sel.isReversed;

                if (this.wordRange && !this.wordRange.isEmpty) {
                    this.changeNumber() ||
                        this.changeEnum() ||
                        this.doNothing(sel);
                }
            }
        });

        this.vEditor.selections = this.replaceRanges;
    }

    private updateSettings() {
        this.vEditor = vscode.window.activeTextEditor;
        this.vDoc = this.vEditor.document;
        this.vSel = this.vEditor.selections;
        this.settings = vscode.workspace.getConfiguration('incrementor');

        this.action = {
			incSmall: (/^(?:[01](?:\.0)?|0\.[1-9])$/.test(this.settings['incSmallValue'])) ? this.settings['incSmallValue'] : 0.01,
			decSmall: (/^(?:[01](?:\.0)?|0\.[1-9])$/.test(this.settings['decSmallValue'])) ? this.settings['decSmallValue'] : -0.01,
			incMedium: this.settings["incMediumValue"] || 0.10,
			decMedium: this.settings["decMediumValue"] || -0.10,
			incBig: this.settings["incBigValue"] || 1.00,
			decBig: this.settings["decBigValue"] || -1.00,
		};
    }

    /**
     * Increments or decrements a number.
     *
     * @private
     * @param editor TextEditorEdit object passed through to make edits.
     * @returns Success_(true)_ or fail_(false)_.
     */
    private changeNumber(): boolean {
        if (this.regex.number.test(this.wordString)) {
            const prevChar = this.getPrevChar();
            let tempString = this.wordString;
            let tempRange  = this.wordRange;

            if (prevChar.char === '-' && tempString[0] !== '-') {
                tempRange = new Range(prevChar.pos, this.wordRange.end);
                tempString = this.vDoc.getText(tempRange);
            }

            // [0] = Original string
            // [1] = Number part
            // [2] = String part (if any)
            const wordReg = this.regex.number.exec(tempString);
            let partNumber = new BigNumber(wordReg[1]);
            const partText = (wordReg[2]) ? wordReg[2] : '';

            if (partNumber.isFinite()) {

                partNumber = partNumber.plus(this.delta);

                const decPlaces = new BigNumber(this.settings['decimalPlaces']).absoluteValue();

                // decPlaces = 0 === rounding off
                if (decPlaces.isInteger() && decPlaces.greaterThan(0)) {
                    partNumber = partNumber.round(decPlaces.toNumber());
                }
                
                let fixed
                if (wordReg[1].indexOf('.') !== -1) {
                    fixed = wordReg[1].length - wordReg[1].indexOf('.') - 1
                } else if (partNumber.toString().indexOf('.') !== -1) {
                    let _strPN = partNumber.toString()
                    fixed = _strPN.length - _strPN.indexOf('.') - 1
                } else {
                    fixed = 0
                }
                const wordChanged = partNumber.toFixed(fixed) + partText;
//                 const wordChanged = partNumber.toString() + partText;

                return this.replace(tempRange, wordChanged);
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private changeEnum() {
        if (this.regex.enum.test(this.wordString) && this.settings.has('enums')) {
            let prevChar   = (this.wordRange.start.character > 0) ? this.getPrevChar() : undefined;
            let tempRange  = this.wordRange;
            let tempString = this.wordString;

            let loopStart = true;
            while (loopStart) {
                if (prevChar && prevChar.char === '-') {
                    prevChar = this.getPrevChar(prevChar.pos.translate(0, -1));

                    while (/\w/.test(prevChar.char) && prevChar.pos.character > 0) {
                        prevChar = this.getPrevChar(prevChar.pos.translate(0, -1));
                    }

                    tempRange = new Range(prevChar.pos.translate(0, 1), tempRange.end);
                    tempString = this.vDoc.getText(tempRange);
                } else {
                    loopStart = false;
                }
            }

            prevChar = this.getPrevChar(this.wordRange.end);

            let loopEnd = true;
            while (loopEnd) {
                if (prevChar.char === '-') {
                    prevChar = this.getPrevChar(prevChar.pos.translate(0, 1));

                    while (/\w/.test(prevChar.char)) {
                        prevChar = this.getPrevChar(prevChar.pos.translate(0, 1));
                    }

                    tempRange = new Range(tempRange.start, prevChar.pos);
                    tempString = this.vDoc.getText(tempRange);
                } else {
                    loopEnd = false;
                }
            }

            let wordChanged = tempString;
            for (const enums of this.settings['enums']) {
                if (_.includes(enums, tempString)) {
                    const eIndex = _.indexOf(enums, tempString);

                    // Cycle enums
                    if (this.delta === this.action.incMedium) {
                        if (enums.length - 1 === eIndex && this.settings['loopEnums']) {
                            // Is last, Cycle around
                            wordChanged = enums[0];
                        } else if (enums.length - 1 === eIndex) {
                            // Is last, don't inc
                            wordChanged = enums[eIndex];
                        } else {
                            wordChanged = enums[eIndex + 1];
                        }
                    } else if (this.delta === this.action.decMedium) {
                        if (eIndex === 0 && this.settings['loopEnums']) {
                            // Is last, Cycle around
                            wordChanged = enums[enums.length - 1];
                        } else if (eIndex === 0) {
                            // Is last, don't inc
                            wordChanged = enums[0];
                        } else {
                            wordChanged = enums[eIndex - 1];
                        }
                    }

                    return this.replace(tempRange, wordChanged);
                }
            }

            return false;
        } else {
            return false;
        }
    }

    /*private changeRGB(editor: TextEditorEdit) {
        let exps: {range: Range, text: string} = this.checkLineForPattern(this.wordRange.start, this.regex.rgbLine);

        if (exps) {
            if (_.isArray(exps)) {
                for (const exp of exps as any[]) {
                    if (exp.range.contains(this.wordRange)) {
                        exps = exp;
                        break;
                    }
                }
            } else {
                if (!exps.range.contains(this.wordRange)) {
                    return false;
                }
            }

            // const expsSplitRGB = exps.text.split(/(\d+)(?!\s*\)|\.)/);
            const expsSplitAlpha = (/(1|0?\.\d+|0)(?=\s*\))/.test(exps.text)) ? exps.text.split(/(1|0?\.\d+|0)(?=\s*\))/) : false;
            // const rangeR = new Range(exps.range.start.translate(0, expsSplitRGB[0].length), exps.range.start.translate(0, expsSplitRGB[0].length + expsSplitRGB[1].length));
            // const rangeG = new Range(rangeR.end.translate(0, expsSplitRGB[2].length), rangeR.end.translate(0, expsSplitRGB[2].length + expsSplitRGB[3].length));
            // const rangeB = new Range(rangeG.end.translate(0, expsSplitRGB[4].length), rangeG.end.translate(0, expsSplitRGB[4].length + expsSplitRGB[5].length));

            const rangeA = (expsSplitAlpha !== false) ? new Range(exps.range.start.translate(0, expsSplitAlpha[0].length), exps.range.start.translate(0, expsSplitAlpha[0].length + expsSplitAlpha[1].length)) : false;

            let tempNumber = new BigNumber(this.wordString);
            if (rangeA && this.wordRange.isEqual(rangeA)) {
                if (this.delta === this.action.incSmall || this.delta === this.action.decSmall) {
                    tempNumber = new BigNumber(_.clamp(tempNumber.plus(this.delta).toNumber(), 0, 1));
                }
            } else {
                if (this.delta !== this.action.incSmall || this.delta !== this.action.decSmall) {
                    tempNumber = new BigNumber(_.clamp(tempNumber.plus(this.delta).toNumber(), 0, 255));
                }
            }

            editor.replace(this.wordRange, tempNumber.toString());
            this.replaceRanges.push(new Selection(this.wordRange.start, this.wordRange.start.translate(0, tempNumber.toString().length)));
        } else {
            return false;
        }
    }*/

    private doNothing(sel: Selection) {
        this.replaceRanges.push(sel);

        return true;
    }

    private getPrevChar(pos?: Position) {
        if (this.wordRange.start.character === 0) {
            return {
                pos,
                char: ''
            };
        }

        if (pos === undefined && this.wordRange.start.character > 0) {
            pos = this.wordRange.start.translate(0, -1);
        }

        return {
            pos,
            char: this.vDoc.getText(new Range(pos, pos.translate(0, 1)))
        };
    }

    /**
     * Checks if there are any Selections after `pos`.
     *
     * @private
     * @param pos The Position to look after.
     * @returns `true` if Selections exist after `pos`, otherwise `false`.
     */
    private hasSelectionsAfter(pos: Position) {
        for (const sel of this.replaceRanges) {
            if (sel.start.isAfter(pos)) {
                return true;
            }
        }

        return false;
    }

    private hasHiddenSelsAfter(pos: Position) {
        let i = 0;
        for (const sel of this.vSel) {
            if (!this.replaceRanges[i] && sel.start.isAfter(pos)) {
                return true;
            }

            i += 1;
        }

        return false;
    }

    /**
     * Shifts all Selections on line after `pos` by `amount`.
     *
     * @private
     * @param pos The Position to look after.
     * @param amount The amount to shift the selection by.
     */
    private shiftSelectionsAfter(pos: Position, amount: number): void {
        this.replaceRanges.forEach((sel, index) => {
            if (sel.start.isAfter(pos)) {
                this.replaceRanges[index] = new Selection(this.replaceRanges[index].start.translate(0, amount), this.replaceRanges[index].end.translate(0, amount));
            }
        });
    }

    /*private shiftLastSelection(amount: number): void {
        const lastIndex = this.replaceRanges.length - 1;

        this.replaceRanges[lastIndex] = new Selection(this.replaceRanges[lastIndex].start.translate(0, amount), this.replaceRanges[lastIndex].end.translate(0, amount));
    }*/

    /**
     * Replaces text at `range` with `text`.
     *
     * _Does more than `TextEditorEdit.replace()`._
     *
     * @private
     * @param range Range at which text will be replaced.
     * @param text Text to replace with.
     * @returns true
     */
    private replace(range: Range, text: string): true {
        const textOld = this.vDoc.getText(range);
        const diffLength = text.length - textOld.length;

        // console.warn(`${text}'s diffLength = ${diffLength}`);

        this.edit.replace(range, text);

        let rangeNew = new Range(range.start, range.start.translate(0, text.length));

        if (this.hiddenSels.isOn && this.hiddenSels.pos.line === rangeNew.start.line && rangeNew.start.isAfter(this.hiddenSels.pos)) {
            rangeNew = new Range(rangeNew.start.translate(0, this.hiddenSels.diff), rangeNew.end.translate(0, this.hiddenSels.diff));
        }

        if (diffLength !== 0) {
            if (this.hasSelectionsAfter(range.end)) {
                // FIXME: All combinations work besides [1][0][2]
                // ^^^^ I THINK THIS IS FIXED ^^^^^
                this.shiftSelectionsAfter(range.end, diffLength);
            }
            if (this.hasHiddenSelsAfter(range.end)) {
                if (this.hiddenSels.isOn) {
                    this.hiddenSels.diff += diffLength;
                } else {
                    this.hiddenSels.diff = diffLength;
                }

                this.hiddenSels.isOn = true;
                this.hiddenSels.pos = range.end;
            }
        }

        if (this.isReversed) {
            this.replaceRanges.push(new Selection(rangeNew.end, rangeNew.start));
        } else {
            this.replaceRanges.push(new Selection(rangeNew.start, rangeNew.end));
        }

        this.lastRange = rangeNew;
        this.lastValueDiff = diffLength;

        return true;
    }

    /*private getPrevText(length: number, pos = this.wordRange.start) {
        let len = new BigNumber(length).abs();
        len = (len.isZero()) ? new BigNumber(1) : len;
        const range = new Range(pos.translate(0, len.negated().toNumber()), pos);

        return {
            range,
            text: this.vDoc.getText(range)
        };
    }*/

    /**
     * Check a line for a specific pattern and return it if it exists.
     *
     * @private
     * @param pos Line Position to check at.
     * @param pattern Pattern to search for.
     * @returns No matches: false; One match: {range, text}; Many matches: array of match objects;
     */
    /*private checkLineForPattern(pos: Position, pattern: RegExp) {
        const line = this.vDoc.lineAt(pos);
        const lineText = this.vDoc.getText(line.range);
        const results = [];

        if (pattern.test(lineText)) {
            const matches = lineText.match(pattern);

            for (const match of matches) {
                const startPos = line.range.start.translate(0, lineText.indexOf(match));
                const endPos = startPos.translate(0, match.length);

                results.push({
                    range: new Range(startPos, endPos),
                    text: match
                });
            }

            if (results.length > 1) {
                return results;
            } else {
                return results[0];
            }
        } else {
            return false;
        }
    }*/
}

// this method is called when your extension is deactivated
// export function deactivate() {
// }
