import { Term } from "./grammar";

export class SequenceUtil {
    public static termsEqual<T>(termA: Term<T>, termB: Term<T>) {
        return termA.type === "non-terminal" && termB.type === "non-terminal" && termA.name === termB.name
            || termA.type === "terminal" && termB.type === "terminal" && termA.terminal === termB.terminal;
    }

    public static sequenceStartsWith<T>(sequence: Term<T>[], subSequence: Term<T>[]) {
        if (sequence.length < subSequence.length) {
            return false;
        }
        for (let i = 0; i < subSequence.length; i++) {
            if (!SequenceUtil.termsEqual(sequence[i], subSequence[i])) {
                return false;
            }
        }
        return true;
    }

    public static sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
        if (sequence.length >= 1) {
            const firstTerm = sequence[0];
            return firstTerm.type === "non-terminal" && firstTerm.name === nonTerminal;
        }
        return false;
    }
}
