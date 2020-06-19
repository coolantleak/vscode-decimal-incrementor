/* tslint:disable:ter-prefer-arrow-callback */

// The module 'assert' provides assertion methods from node
import * as chai from "chai";
chai.should();

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as _ from "lodash";

let vEditor: vscode.TextEditor = undefined;
let vDoc: vscode.TextDocument = undefined;
let vSel: vscode.Selection[] = undefined;
let sel: vscode.Selection;
let text: string;

before(function (done) {
	this.timeout(1000); // A very long environment setup.
	setTimeout(done, 500);
});

describe("Numbers", function () {
	this.slow(110);
	this.timeout(200);

	beforeEach(function () {
		vEditor = vscode.window.activeTextEditor;
		vDoc = vEditor.document;
		vSel = vEditor.selections;
	});

	it("should have 1.00 as selected text", function (done) {
		_.delay(
			(done) => {
				sel = new vscode.Selection(1, 19, 1, 23);
				vEditor.selection = sel;
				text = vDoc.getText(vEditor.selection);

				try {
					text.should.equal("1.00");
					done();
				} catch (error) {
					done(error);
				}
			},
			100,
			done
		);
    });
    
	describe("Small", function () {
		it("should increment 1.00 to 1.01", function (done) {
			vscode.commands.executeCommand("incrementor.incSmall");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("1.01");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});

		it("should decrement 1.01 to 1.00", function (done) {
			vscode.commands.executeCommand("incrementor.decSmall");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("1.00");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});

    });
    
    describe("Medium", function () {
		it("should increment 1.00 to 1.10", function (done) {
			vscode.commands.executeCommand("incrementor.incMedium");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("1.10");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});

		it("should decrement 1.10 to 1.00", function (done) {
			vscode.commands.executeCommand("incrementor.decMedium");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("1.00");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});
    });
    
    describe("Big", function () {
		it("should increment 1.00 to 2.00", function (done) {
			vscode.commands.executeCommand("incrementor.incBig");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("2.00");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});

		it("should decrement 2.00 to 1.00", function (done) {
			vscode.commands.executeCommand("incrementor.decBig");
			_.delay(
				(done) => {
					text = vDoc.getText(vEditor.selection);

					try {
						text.should.equal("1.00");
						done();
					} catch (error) {
						done(error);
					}
				},
				100,
				done
			);
		});
	});
});
