// import { Deterministic } from '../grammar/deterministic';
import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';

let grammar: Grammar<string> = {
    E: [
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '^' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '*' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '+' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: 'a' }]
    ]
};

console.log('--- original ---');
Printer.printGrammar(grammar);

grammar = Recursion.removeAllLeftRecursion(grammar);
console.log('--- removed left-recursion ---');
Printer.printGrammar(grammar);

// grammar = Deterministic.leftFactor(grammar);
// console.log('--- left-factored ---');
// Printer.printGrammar(grammar);

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
        let accepted = 0;
        let index = inputIndex;
        for (const term of sequence) {
            if (term.type === 'terminal') {
                if (input[index] === term.terminal) {
                    accepted += 1;
                    index += 1;
                } else {
                    accepted = 0;
                    index = inputIndex;
                    break;
                }
            } else {
                const advanced = acceptNonTerminal(input, index, term.name);
                if (advanced >= 0) {
                    accepted += advanced;
                    index += advanced;
                } else {
                    accepted = 0;
                    index = inputIndex;
                    break;
                }
            }
        }
        if (accepted >= 1) {
            return accepted;
        }
    }
    return -1;
}

console.log(acceptNonTerminal(['f', 'e', 'd'], 0, 'A'));
