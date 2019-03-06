import { Grammar, Term } from './grammar';
import { SequenceUtil } from './sequence-util';

export class Deterministic {
    public static leftFactor<T>(grammar: Grammar<T>) {
        const nonTerminals = Object.keys(grammar);
        const newGrammar = { ...grammar };
        for (const nonTerminal of nonTerminals) {
            let hasCommonPrefix = true;
            let newNonTerminalCounter = 0;
            while (hasCommonPrefix) {
                hasCommonPrefix = false;
                let commonPrefix: Term<T>[] = [];
                const sequences = newGrammar[nonTerminal];
                for (let i = 0; i < sequences.length; i++) {
                    for (let j = 0; j < i; j++) {
                        let k = 0;
                        while (k < sequences[i].length && k < sequences[j].length && SequenceUtil.termsEqual(sequences[i][k], sequences[j][k])) {
                            k += 1;
                        }
                        if (k > commonPrefix.length) {
                            commonPrefix = sequences[i].slice(0, k);
                        }
                    }
                }
                hasCommonPrefix = commonPrefix.length >= 1;
                if (hasCommonPrefix) {
                    const newNonTerminal = `${nonTerminal}"${newNonTerminalCounter++}`;
                    const newSequencesA: Term<T>[][] = [
                        [...commonPrefix, { type: 'non-terminal', name: newNonTerminal }]
                    ];
                    const newSequencesB: Term<T>[][] = [];
                    for (const sequence of sequences) {
                        if (SequenceUtil.sequenceStartsWith(sequence, commonPrefix)) {
                            newSequencesB.push(sequence.slice(commonPrefix.length));
                        } else {
                            newSequencesA.push(sequence);
                        }
                    }
                    newGrammar[nonTerminal] = newSequencesA;
                    newGrammar[newNonTerminal] = newSequencesB;
                }
            }
        }
        return newGrammar;
    }
}
