import { Grammar, Term } from './grammar';
import { SequenceUtil } from './sequence-util';

export class Recursion {
    public static hasDirectLeftRecursion(nonTerminal: string, sequences: Term<unknown>[][]) {
        return sequences.some((sequence) => SequenceUtil.sequenceStartsWithNonTerminal(sequence, nonTerminal));
    }

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

    public static removeAllLeftRecursion<T>(grammar: Grammar<T>) {
        const orderedNonTerminals = Object.keys(grammar);
        const newGrammar = { ...grammar };
        for (let i = 0; i < orderedNonTerminals.length; i++) {
            const oldNonTerminal = orderedNonTerminals[i];
            const oldSequencesA = newGrammar[oldNonTerminal]!;
            const newSequencesA = new Set(oldSequencesA);
            for (let j = 0; j < i; j++) {
                for (const sequenceA of oldSequencesA) {
                    if (SequenceUtil.sequenceStartsWithNonTerminal(sequenceA, orderedNonTerminals[j])) {
                        const [, ...rest] = sequenceA;
                        newSequencesA.delete(sequenceA);
                        const sequencesB = newGrammar[orderedNonTerminals[j]]!;
                        for (const sequenceB of sequencesB) {
                            newSequencesA.add([...sequenceB, ...rest]);
                        }
                    }
                }
            }
            const newNonTerminal = `${oldNonTerminal}'`;
            const [sequencesA, sequencesB] = Recursion.removeDirectLeftRecursion(oldNonTerminal, newNonTerminal, [...newSequencesA]);
            newGrammar[oldNonTerminal] = sequencesA;
            newGrammar[newNonTerminal] = sequencesB;
        }
        return newGrammar;
    }
}
