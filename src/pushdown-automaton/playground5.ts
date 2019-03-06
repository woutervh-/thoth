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

grammar = Minimizer.trimUnreachables(grammar, 'A');
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);
