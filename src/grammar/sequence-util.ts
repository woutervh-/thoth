import { Term } from './grammar';

export class SequenceUtil {
    public static sequenceStartsWith<T>(sequence: Term<T>[], subSequence: Term<T>[]) {
        if (sequence.length < subSequence.length) {
            return false;
        }
        for (let i = 0; i < subSequence.length; i++) {
            if (subSequence[i] !== sequence[i]) {
                return false;
            }
        }
        return true;
    }

    public static sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
        if (sequence.length >= 1) {
            const firstTerm = sequence[0];
            return firstTerm.type === 'non-terminal' && firstTerm.name === nonTerminal;
        }
        return false;
    }
}
