export const module = true;

interface TerminalReference {
    type: 'terminal';
    name: string;
}

interface NonTerminal<T> {
    type: 'non-terminal';
    nonTerminal: T;
}

type Term<T> = TerminalReference | NonTerminal<T>;

interface Rule<T> {
    terminal: string;
    sequence: Term<T>[];
}

const grammar: Rule<string>[] = [
    {
        sequence: [{ type: 'terminal', name: 'A' }, { type: 'non-terminal', nonTerminal: '0' }],
        terminal: 'A'
    },
    {
        sequence: [{ type: 'terminal', name: 'B' }, { type: 'non-terminal', nonTerminal: '1' }],
        terminal: 'A'
    },
    {
        sequence: [{ type: 'terminal', name: 'A' }, { type: 'non-terminal', nonTerminal: '0' }],
        terminal: 'B'
    },
    {
        sequence: [{ type: 'terminal', name: 'B' }, { type: 'non-terminal', nonTerminal: '1' }],
        terminal: 'B'
    }
];

// Build mapping from non-terminal to alternative sequences.
const ruleMap: Map<string, Term<string>[][]> = new Map();
for (const rule of grammar) {
    if (!ruleMap.has(rule.terminal)) {
        ruleMap.set(rule.terminal, []);
    }
    ruleMap.get(rule.terminal)!.push(rule.sequence);
}

function removeDirectLeftRecursion<T>(rules: Rule<T>[]) {
}
