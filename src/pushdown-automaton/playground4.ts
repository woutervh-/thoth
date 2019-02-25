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

interface Rule<T> {
    nonTerminal: string;
    sequence: Term<T>[];
}

let grammar: Rule<string>[] = [
    {
        nonTerminal: 'A',
        sequence: [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }]
    },
    {
        nonTerminal: 'A',
        sequence: [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }]
    },
    {
        nonTerminal: 'B',
        sequence: [{ type: 'non-terminal', name: 'A' }, { type: 'terminal', terminal: '0' }]
    },
    {
        nonTerminal: 'B',
        sequence: [{ type: 'non-terminal', name: 'B' }, { type: 'terminal', terminal: '1' }]
    }
];

// Get rid of A -> A type rules.
grammar = grammar.filter((rule) => {
    if (rule.sequence.length === 1) {
        const term = rule.sequence[0];
        return term.type === 'non-terminal' && term.name === rule.nonTerminal;
    }
    return true;
});

function sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
    if (sequence.length >= 1) {
        const firstTerm = sequence[0];
        return firstTerm.type === 'non-terminal' && firstTerm.name === nonTerminal;
    }
    return false;
}

function removeDirectLeftRecursion<T>(nonTerminal: string, sequences: Term<T>[][]): Rule<T>[] {
    const newNonTerminal = `${nonTerminal}'`;
    const newSequencesA: Term<T>[][] = [];
    const newSequencesB: Term<T>[][] = [];

    for (const sequence of sequences) {
        if (sequenceStartsWithNonTerminal(sequence, nonTerminal)) {
            const [, ...rest] = sequence;
            newSequencesB.push(rest);
            newSequencesB.push([...rest, { type: 'non-terminal', name: newNonTerminal }]);
        } else {
            newSequencesA.push(sequence);
            newSequencesA.push([...sequence, { type: 'non-terminal', name: newNonTerminal }]);
        }
    }

    return [
        ...newSequencesA.map<Rule<T>>((sequence) => {
            return {
                nonTerminal,
                sequence
            };
        }),
        ...newSequencesB.map<Rule<T>>((sequence) => {
            return {
                nonTerminal: newNonTerminal,
                sequence
            };
        })
    ];
}

{
    // Build mapping from non-terminal to alternative sequences.
    const ruleMap: Map<string, Term<string>[][]> = new Map();
    for (const rule of grammar) {
        if (!ruleMap.has(rule.nonTerminal)) {
            ruleMap.set(rule.nonTerminal, []);
        }
        ruleMap.get(rule.nonTerminal)!.push(rule.sequence);
    }

    grammar = [];
    for (const [nonTerminal, rules] of ruleMap.entries()) {
        grammar.push(...removeDirectLeftRecursion(nonTerminal, rules));
    }
}

{
    // Build mapping from non-terminal to alternative sequences.
    const ruleMap: Map<string, Term<string>[][]> = new Map();
    for (const rule of grammar) {
        if (!ruleMap.has(rule.nonTerminal)) {
            ruleMap.set(rule.nonTerminal, []);
        }
        ruleMap.get(rule.nonTerminal)!.push(rule.sequence);
    }

    // Build mapping from non-terminal to topological ordering index.
    const orderingMap: Map<string, number> = new Map(); // TODO: do we need map or is set good enough?
    const orderingList: string[] = [];
    for (const rule of grammar) {
        if (!orderingMap.has(rule.nonTerminal)) {
            orderingMap.set(rule.nonTerminal, orderingList.length);
            orderingList.push(rule.nonTerminal);
        }
    }

    for (let i = 0; i < orderingList.length; i++) {
        const rules = ruleMap.get(orderingList[i])!;
        for (let j = 0; j < i; j++) {
            for (const rule of rules) {
                if (sequenceStartsWithNonTerminal(rule, orderingList[j])) {

                }
            }
        }
    }
}

console.log(JSON.stringify(grammar));
