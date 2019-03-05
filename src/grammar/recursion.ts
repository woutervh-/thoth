import { Term } from './grammar';
import { SequenceUtil } from './sequence-util';

export class Recursion {
    public static removeDirectLeftRecursion<T>(oldNonTerminal: string, newNonTerminal: string, sequences: Term<T>[][]): [Term<T>[][], Term<T>[][]] {
        const newSequencesA: Term<T>[][] = [];
        const newSequencesB: Term<T>[][] = [];

        for (const sequence of sequences) {
            if (SequenceUtil.sequenceStartsWithNonTerminal(sequence, oldNonTerminal)) {
                const [, ...rest] = sequence;
                newSequencesB.push(rest);
                newSequencesB.push([...rest, { type: 'non-terminal', name: newNonTerminal }]);
            } else {
                newSequencesA.push(sequence);
                newSequencesA.push([...sequence, { type: 'non-terminal', name: newNonTerminal }]);
            }
        }

        return [
            newSequencesA,
            newSequencesB
        ];
    }
}
