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

// {
//     let hasSubstitutions = true;
//     while (hasSubstitutions) {
//         hasSubstitutions = false;
//         const nonTerminals = [...grammar.keys()];
//         for (const nonTerminal of nonTerminals) {
//             const oldSequences = grammar.get(nonTerminal)!;
//             const newSequences: Term<string>[][] = [];
//             for (const sequence of oldSequences) {
//                 if (sequence.length >= 1) {
//                     const [first, ...rest] = sequence;
//                     if (first.type === 'non-terminal') {
//                         for (const nonTerminalSequence of grammar.get(first.name)!) {
//                             newSequences.push([...nonTerminalSequence, ...rest]);
//                         }
//                         hasSubstitutions = true;
//                     } else {
//                         newSequences.push(sequence);
//                     }
//                 } else {
//                     newSequences.push(sequence);
//                 }
//             }
//             grammar.set(nonTerminal, newSequences);
//         }
//     }

//     console.log('--- substituting sequences that start with non-terminal ---');
//     printGrammar(grammar);
// }

// {
//     let hasChanged = true;
//     while (hasChanged) {
//         hasChanged = false;
//         const nonTerminals = [...grammar.keys()];
//         for (const nonTerminal of nonTerminals) {
//             const oldSequences = grammar.get(nonTerminal)!;
//             const newSequences: Term<string>[][] = [];
//             for (const oldSequence of oldSequences) {
//                 if (oldSequence.every((term) => term.type !== 'non-terminal' || grammar.has(term.name))) {
//                     newSequences.push(oldSequence);
//                 } else {
//                     hasChanged = true;
//                 }
//             }
//             if (newSequences.length >= 1) {
//                 grammar.set(nonTerminal, newSequences);
//             } else {
//                 grammar.delete(nonTerminal);
//                 hasChanged = true;
//             }
//             if (oldSequences.length !== newSequences.length) {
//                 hasChanged = true;
//             }
//         }
//     }

//     console.log('--- removing empty non-terminals ---');
//     printGrammar(grammar);
// }

// // interface PushDownAccepter<T, U> {
// //     input: T | null;
// //     pop: U | null;
// //     push: U[];
// // }

// // const startingNonTerminal = 'A';

// // const fsm: FiniteStateMachine<string, PushDownAccepter<string, string>> = {
// //     acceptingStates: [],
// //     initialState: startingNonTerminal,
// //     transitions: []
// // };
