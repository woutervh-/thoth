import { Grammar } from './grammar';

export class Printer {
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
