import * as assert from "assert";
import { Term } from "../../src/grammar/grammar";
import { Recursion } from "../../src/grammar/recursion";

describe("Recursion", () => {
    describe("Recursion.removeDirectLeftRecursion", () => {
        it("removes direct left-recursion #1", () => {
            const oldNonTerminal = "S";
            const newNonTerminal = `${oldNonTerminal}"`;
            const sequences: Term<string>[][] = [
                [{ type: "non-terminal", name: oldNonTerminal }]
            ];
            const [newSequencesA, newSequencesB] = Recursion.removeDirectLeftRecursion(oldNonTerminal, newNonTerminal, sequences);
            assert.deepStrictEqual(newSequencesA, []);
            assert.deepStrictEqual(newSequencesB, [[], [{ type: "non-terminal", name: newNonTerminal }]]);
        });

        it("removes direct left-recursion #2", () => {
            const oldNonTerminal = "S";
            const newNonTerminal = `${oldNonTerminal}"`;
            const sequences: Term<string>[][] = [
                [{ type: "non-terminal", name: oldNonTerminal }, { type: "terminal", terminal: "a" }]
            ];
            const [newSequencesA, newSequencesB] = Recursion.removeDirectLeftRecursion(oldNonTerminal, newNonTerminal, sequences);
            assert.deepStrictEqual(newSequencesA, []);
            assert.deepStrictEqual(newSequencesB, [[{ type: "terminal", terminal: "a" }], [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: newNonTerminal }]]);
        });

        it("removes direct left-recursion #3", () => {
            const oldNonTerminal = "S";
            const newNonTerminal = `${oldNonTerminal}"`;
            const sequences: Term<string>[][] = [
                [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: oldNonTerminal }]
            ];
            const [newSequencesA, newSequencesB] = Recursion.removeDirectLeftRecursion(oldNonTerminal, newNonTerminal, sequences);
            assert.deepStrictEqual(newSequencesA, [
                [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: oldNonTerminal }],
                [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: oldNonTerminal }, { type: "non-terminal", name: newNonTerminal }]
            ]);
            assert.deepStrictEqual(newSequencesB, []);
        });
    });
});
