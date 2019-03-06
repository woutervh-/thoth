// import { FiniteStateMachine } from '../finite-state-machine/finite-state-machine';
export const isModule = true;

const grammar: Map<string, Term<string>[][]> = new Map();
// grammar.set(
//     'A',
//     [
//         [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }],
//         [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }],
//         [{ type: 'terminal', terminal: '2' }]
//     ]
// );
// grammar.set(
//     'B',
//     [
//         [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }],
//         [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }]
//     ]
// );
grammar.set(
    'S',
    [
        [{ type: 'non-terminal', name: 'S' }, { type: 'terminal', terminal: 'q' }]
    ]
);
grammar.set(
    'A',
    [
        [{ type: 'non-terminal', name: 'C' }, { type: 'terminal', terminal: 'd' }]
    ]
);
grammar.set(
    'B',
    [
        [{ type: 'non-terminal', name: 'C' }, { type: 'terminal', terminal: 'e' }]
    ]
);
grammar.set(
    'C',
    [
        [{ type: 'non-terminal', name: 'A' }],
        [{ type: 'non-terminal', name: 'B' }],
        [{ type: 'terminal', terminal: 'f' }]
    ]
);

// TODO: use one single object per terminal/non-terminal? {type:'terminal',terminal:'0'} <- re-use

printGrammar(grammar);

{
    for (const [nonTerminal, sequences] of grammar.entries()) {
        grammar.set(nonTerminal, sequences.filter((sequence) => sequence.length !== 1 || !sequenceStartsWithNonTerminal(sequence, nonTerminal)));
    }

    console.log('--- removing A -> A rules ---');
    printGrammar(grammar);
}

{
    

    console.log('--- removing left-recursion ---');
    printGrammar(grammar);
}

{
    

    console.log('--- removing undeterminism (left-factoring) ---');
    printGrammar(grammar);
}

{
    let hasSubstitutions = true;
    while (hasSubstitutions) {
        hasSubstitutions = false;
        const nonTerminals = [...grammar.keys()];
        for (const nonTerminal of nonTerminals) {
            const oldSequences = grammar.get(nonTerminal)!;
            const newSequences: Term<string>[][] = [];
            for (const sequence of oldSequences) {
                if (sequence.length >= 1) {
                    const [first, ...rest] = sequence;
                    if (first.type === 'non-terminal') {
                        for (const nonTerminalSequence of grammar.get(first.name)!) {
                            newSequences.push([...nonTerminalSequence, ...rest]);
                        }
                        hasSubstitutions = true;
                    } else {
                        newSequences.push(sequence);
                    }
                } else {
                    newSequences.push(sequence);
                }
            }
            grammar.set(nonTerminal, newSequences);
        }
    }

    console.log('--- substituting sequences that start with non-terminal ---');
    printGrammar(grammar);
}

{
    let hasChanged = true;
    while (hasChanged) {
        hasChanged = false;
        const nonTerminals = [...grammar.keys()];
        for (const nonTerminal of nonTerminals) {
            const oldSequences = grammar.get(nonTerminal)!;
            const newSequences: Term<string>[][] = [];
            for (const oldSequence of oldSequences) {
                if (oldSequence.every((term) => term.type !== 'non-terminal' || grammar.has(term.name))) {
                    newSequences.push(oldSequence);
                } else {
                    hasChanged = true;
                }
            }
            if (newSequences.length >= 1) {
                grammar.set(nonTerminal, newSequences);
            } else {
                grammar.delete(nonTerminal);
                hasChanged = true;
            }
            if (oldSequences.length !== newSequences.length) {
                hasChanged = true;
            }
        }
    }

    console.log('--- removing empty non-terminals ---');
    printGrammar(grammar);
}

// interface PushDownAccepter<T, U> {
//     input: T | null;
//     pop: U | null;
//     push: U[];
// }

// const startingNonTerminal = 'A';

// const fsm: FiniteStateMachine<string, PushDownAccepter<string, string>> = {
//     acceptingStates: [],
//     initialState: startingNonTerminal,
//     transitions: []
// };
