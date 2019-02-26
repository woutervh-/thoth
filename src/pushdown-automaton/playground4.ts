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

function sequenceStartsWith<T>(sequence: Term<T>[], subSequence: Term<T>[]) {
    if (sequence.length < subSequence.length) {
        return false;
    }
    for (let i = 0; i < subSequence.length; i++) {
        if (subSequence[i] !== sequence[i]) {
            return false;
        }
    }
    return true;
}

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
    // for (const [nonTerminal, sequences] of grammar.entries()) {
    //     for (const sequence of sequences) {
    //         console.log(`${nonTerminal} → ${sequence.map((term) => term.type === 'non-terminal' ? term.name : term.terminal).join(',')}`);
    //     }
    // }
    for (const [nonTerminal, sequences] of grammar.entries()) {
        console.log(`${nonTerminal} → ${sequences.map((sequence) => sequence.map((term) => term.type === 'non-terminal' ? term.name : term.terminal).join(',')).join(' | ')}`);
    }
}

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

// Get rid of A -> A type rules.
for (const [nonTerminal, sequences] of grammar.entries()) {
    grammar.set(nonTerminal, sequences.filter((sequence) => sequence.length !== 1 || !sequenceStartsWithNonTerminal(sequence, nonTerminal)));
}

console.log('---');
printGrammar(grammar);

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

        const newNonTerminal = `${orderedNonTerminals[i]}'`;
        const [sequencesA, sequencesB] = removeDirectLeftRecursion(orderedNonTerminals[i], newNonTerminal, [...newSequencesA]);
        grammar.set(orderedNonTerminals[i], sequencesA);
        grammar.set(newNonTerminal, sequencesB);
    }
}

console.log('---');
printGrammar(grammar);

{
    const nonTerminals = [...grammar.keys()];
    for (const nonTerminal of nonTerminals) {
        let hasCommonPrefix = true;
        let newNonTerminalCounter = 0;
        while (hasCommonPrefix) {
            hasCommonPrefix = false;
            let commonPrefix: Term<string>[] = [];
            const sequences = grammar.get(nonTerminal)!;
            for (let i = 0; i < sequences.length; i++) {
                for (let j = 0; j < i; j++) {
                    let k = 0;
                    while (k < sequences[i].length && k < sequences[j].length && sequences[i][k] === sequences[j][k]) {
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
                const newSequencesA: Term<string>[][] = [
                    [...commonPrefix, { type: 'non-terminal', name: newNonTerminal }]
                ];
                const newSequencesB: Term<string>[][] = [];
                for (const sequence of sequences) {
                    if (sequenceStartsWith(sequence, commonPrefix)) {
                        newSequencesB.push(sequence.slice(commonPrefix.length));
                    } else {
                        newSequencesA.push(sequence);
                    }
                }
                grammar.set(nonTerminal, newSequencesA);
                grammar.set(newNonTerminal, newSequencesB);
            }
        }
    }
}

{
    // TODO: prune empty rules and empty sequences
}

console.log('---');
printGrammar(grammar);