export const module = true;

interface NonTerminalReference {
    type: 'non-terminal';
    name: string;
}

interface Terminal<T> {
    type: 'terminal';
    terminal: T;
}

type Term<T> = NonTerminalReference | Terminal<T>;

function sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
    if (sequence.length >= 1) {
        const firstTerm = sequence[0];
        return firstTerm.type === 'non-terminal' && firstTerm.name === nonTerminal;
    }
    return false;
}

function removeDirectLeftRecursion<T>(oldNonTerminal: string, newNonTerminal: string, sequences: Term<T>[][]): [Term<T>[][], Term<T>[][]] {
    const newSequencesA: Term<T>[][] = [];
    const newSequencesB: Term<T>[][] = [];

    for (const sequence of sequences) {
        if (sequenceStartsWithNonTerminal(sequence, oldNonTerminal)) {
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

function printGrammar<T>(grammar: Map<string, Term<T>[][]>) {
    for (const [nonTerminal, sequences] of grammar.entries()) {
        for (const sequence of sequences) {
            console.log(`${nonTerminal} → ${sequence.map((term) => term.type === 'non-terminal' ? term.name : term.terminal).join(',')}`);
        }
    }
}

const grammar: Map<string, Term<string>[][]> = new Map();
grammar.set(
    'A',
    [
        [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }],
        [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }],
        [{ type: 'terminal', terminal: '2' }]
    ]
);
grammar.set(
    'B',
    [
        [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }],
        [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }]
    ]
);

printGrammar(grammar);

// Get rid of A -> ∅ and A -> A type rules.
for (const [nonTerminal, sequences] of grammar.entries()) {
    grammar.set(nonTerminal, sequences.filter((sequence) => sequence.length >= 2 || !sequenceStartsWithNonTerminal(sequence, nonTerminal)));
}

{
    const orderedNonTerminals = [...grammar.keys()];

    for (let i = 0; i < orderedNonTerminals.length; i++) {
        const oldSequencesA = grammar.get(orderedNonTerminals[i])!;
        const newSequencesA = new Set(oldSequencesA);
        for (let j = 0; j < i; j++) {
            for (const sequenceA of oldSequencesA) {
                if (sequenceStartsWithNonTerminal(sequenceA, orderedNonTerminals[j])) {
                    const [, ...rest] = sequenceA;
                    newSequencesA.delete(sequenceA);
                    const sequencesB = grammar.get(orderedNonTerminals[j])!;
                    for (const sequenceB of sequencesB) {
                        newSequencesA.add([...sequenceB, ...rest]);
                    }
                }
            }
        }

        const [sequencesA, sequencesB] = removeDirectLeftRecursion(orderedNonTerminals[i], `${orderedNonTerminals[i]}'`, [...newSequencesA]);
        grammar.set(orderedNonTerminals[i], sequencesA);
        grammar.set(`${orderedNonTerminals[i]}'`, sequencesB);
    }
}

console.log('---');
printGrammar(grammar);
