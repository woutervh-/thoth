import * as assert from "assert";
import { Term } from "../../src/grammar/grammar";
import { SequenceUtil } from "../../src/grammar/sequence-util";

describe("SequenceUtil", () => {
    describe("SequenceUtil.sequenceStartsWith", () => {
        it("returns true for empty sequences", () => {
            const sequence: Term<string>[] = [];
            const subSequence: Term<string>[] = [];
            assert.ok(SequenceUtil.sequenceStartsWith(sequence, subSequence));
        });

        it("returns true for sequences that start with the given sub-sequence", () => {
            const sequence: Term<string>[] = [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: "A" }];
            const subSequence1: Term<string>[] = [];
            const subSequence2: Term<string>[] = [sequence[0]];
            const subSequence3: Term<string>[] = [sequence[0], sequence[1]];
            assert.ok(SequenceUtil.sequenceStartsWith(sequence, subSequence1));
            assert.ok(SequenceUtil.sequenceStartsWith(sequence, subSequence2));
            assert.ok(SequenceUtil.sequenceStartsWith(sequence, subSequence3));
        });

        it("returns false for sequences that do not start with the given sub-sequence", () => {
            const sequence: Term<string>[] = [{ type: "terminal", terminal: "a" }, { type: "non-terminal", name: "A" }];
            const subSequence1: Term<string>[] = [{ type: "terminal", terminal: "b" }];
            const subSequence2: Term<string>[] = [sequence[1]];
            const subSequence3: Term<string>[] = [sequence[1], sequence[0]];
            assert.ok(!SequenceUtil.sequenceStartsWith(sequence, subSequence1));
            assert.ok(!SequenceUtil.sequenceStartsWith(sequence, subSequence2));
            assert.ok(!SequenceUtil.sequenceStartsWith(sequence, subSequence3));
        });
    });

    describe("SequenceUtil.sequenceStartsWithNonTerminal", () => {
        it("returns true for sequences that start with the given non-terminal", () => {
            const sequence1: Term<string>[] = [{ type: "non-terminal", name: "A" }];
            const sequence2: Term<string>[] = [{ type: "non-terminal", name: "A" }, { type: "non-terminal", name: "B" }];
            const sequence3: Term<string>[] = [{ type: "non-terminal", name: "B" }, { type: "non-terminal", name: "A" }];
            assert.ok(SequenceUtil.sequenceStartsWithNonTerminal(sequence1, "A"));
            assert.ok(SequenceUtil.sequenceStartsWithNonTerminal(sequence2, "A"));
            assert.ok(SequenceUtil.sequenceStartsWithNonTerminal(sequence3, "B"));
        });

        it("returns false for sequences that do not start with the given non-terminal", () => {
            const sequence1: Term<string>[] = [{ type: "non-terminal", name: "A" }];
            const sequence2: Term<string>[] = [{ type: "non-terminal", name: "A" }, { type: "non-terminal", name: "B" }];
            const sequence3: Term<string>[] = [{ type: "terminal", terminal: "A" }];
            assert.ok(!SequenceUtil.sequenceStartsWithNonTerminal(sequence1, "B"));
            assert.ok(!SequenceUtil.sequenceStartsWithNonTerminal(sequence2, "B"));
            assert.ok(!SequenceUtil.sequenceStartsWithNonTerminal(sequence3, "A"));
        });
    });
});
