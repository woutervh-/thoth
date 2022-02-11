import * as assert from "assert";
import { FiniteStateMachine } from "../../src/finite-state-machine/finite-state-machine";
import { Numberfier } from "../../src/finite-state-machine/numberfier";

describe("Numberfier", () => {
    describe("Numberfier.convertStateToNumbers", () => {
        it("produces an equivalent state machine with numbers for state #1", () => {
            const fsm: FiniteStateMachine<string, number> = {
                acceptingStates: ["e"],
                initialState: "a",
                transitions: [
                    ["a", 0, "a"], ["a", 0, "b"], ["a", 0, "c"], ["a", 0, "d"], ["a", 0, "e"],
                    ["a", 1, "d"], ["a", 1, "e"],
                    ["b", 0, "c"],
                    ["b", 1, "e"],
                    ["c", 1, "b"],
                    ["d", 0, "e"]
                ]
            };
            const actual = Numberfier.convertStateToNumbers(fsm);
            const expected: FiniteStateMachine<number, number> = {
                acceptingStates: [4],
                initialState: 0,
                transitions: [
                    [0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4],
                    [0, 1, 3], [0, 1, 4],
                    [1, 0, 2], [1, 1, 4],
                    [2, 1, 1],
                    [3, 0, 4]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });
});
