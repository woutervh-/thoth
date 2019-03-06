import { Deterministic } from '../grammar/deterministic';
import { Grammar } from '../grammar/grammar';
import { Minimizer } from '../grammar/minimizer';
import { Printer } from '../grammar/printer';
import { Recursion } from '../grammar/recursion';

let grammar: Grammar<string> = {
    A: [
        [{ type: 'non-terminal', name: 'C' }, { type: 'terminal', terminal: 'd' }]
    ],
    B: [
        [{ type: 'non-terminal', name: 'C' }, { type: 'terminal', terminal: 'e' }]
    ],
    C: [
        [{ type: 'non-terminal', name: 'A' }],
        [{ type: 'non-terminal', name: 'B' }],
        [{ type: 'terminal', terminal: 'f' }]
    ],
    S: [
        [{ type: 'non-terminal', name: 'S' }, { type: 'terminal', terminal: 'q' }]
    ]
};

console.log('--- original ---');
Printer.printGrammar(grammar);

grammar = Recursion.removeAllLeftRecursion(grammar);
console.log('--- removed left-recursion ---');
Printer.printGrammar(grammar);

grammar = Deterministic.leftFactor(grammar);
console.log('--- left-factored ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeEmptyRules(grammar);
console.log('--- remove empty non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.substituteSimpleNonTerminals(grammar);
console.log('--- substitute simple non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeUnreachables(grammar, ['A', 'B']);
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);

// interface Tree<T> {
//     [0]: Tree<T> | T | undefined;
//     [1]: Tree<T> | T | undefined;
// }

function acceptNonTerminal(input: string[], inputIndex: 0, nonTerminal: string) {
    const sequences = grammar[nonTerminal];
    for (const sequence of sequences) {
        for (const term of sequence) {
            if (term.type === 'non-terminal') {
                const count = acceptNonTerminal(input, inputIndex, term.name);
                if (count >= 1) {
                    inputIndex += count;
                } else if (count === 0) {
                    throw new Error('Parsed 0 input elements.');
                }
            } else if (input[inputIndex] === term.terminal) {
                inputIndex += 1;
            } else {
                break;
            }
        }
        return inputIndex;
    }
    return -1;
}

console.log(acceptNonTerminal(['f', 'e', 'd'], 'A'));
