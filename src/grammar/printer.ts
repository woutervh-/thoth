import { Grammar, Term } from './grammar';

export class Printer {
    public static stringifySequence<T>(sequence: Term<T>[], activeTermIndex: number) {
        let sequenceString = sequence.length >= 1
            ? sequence.map((term, index) => (activeTermIndex === index ? '•' : '') + (term.type === 'non-terminal' ? term.name : term.terminal)).join(',')
            : 'ε';
        if (activeTermIndex >= sequence.length) {
            sequenceString += '•';
        }
        return sequenceString;
    }

    public static printSequence<T>(sequence: Term<T>[], activeTermIndex: number) {
        console.log(Printer.stringifySequence(sequence, activeTermIndex));
    }

    public static printGrammar<T>(grammar: Grammar<T>) {
        for (const nonTerminal of Object.keys(grammar)) {
            const sequencesString = grammar[nonTerminal]
                .map(
                    (sequence) => sequence.length >= 1
                        ? sequence.map((term) => term.type === 'non-terminal' ? term.name : term.terminal).join(',')
                        : 'ε'
                )
                .join(' | ');

            // tslint:disable-next-line:no-console
            console.log(`${nonTerminal} → ${grammar[nonTerminal].length >= 1 ? sequencesString : '∅'}`);
        }
    }
}
