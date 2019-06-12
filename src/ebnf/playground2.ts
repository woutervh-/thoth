import * as perfHooks from 'perf_hooks';

interface Terminal {
    type: 'terminal';
    character: string;
}

interface Reference {
    type: 'reference';
    name: string;
}

interface Sequence {
    type: 'sequence';
    children: EbnfProduction[];
}

interface Choice {
    type: 'choice';
    children: EbnfProduction[];
}

interface Repeat {
    type: 'repeat';
    child: EbnfProduction;
}

interface Optional {
    type: 'optional';
    child: EbnfProduction;
}

interface Empty {
    type: 'empty';
}

type EbnfProduction = Terminal | Reference | Sequence | Choice | Repeat | Optional | Empty;

interface EbnfGrammar {
    [Key: string]: EbnfProduction;
}

interface BnfSequence {
    type: 'sequence';
    children: (Terminal | Reference | Empty)[];
}

interface BnfChoice {
    type: 'choice';
    children: (BnfSequence | Terminal | Reference | Empty)[];
}

type BnfProduction = BnfChoice | BnfSequence | Terminal | Reference | Empty;

interface BnfGrammar {
    [Key: string]: BnfProduction;
}

interface NormalizedBnfChoice {
    type: 'choice';
    children: BnfSequence[];
}

interface NormalizedBnfGrammar {
    [Key: string]: NormalizedBnfChoice;
}

function toBnf(grammar: EbnfGrammar): BnfGrammar {
    const newGrammarRules: BnfGrammar = {};
    let newNonTerminalCounter = 0;

    function toBnfSequence(rule: BnfChoice['children'][number]): BnfSequence {
        if (rule.type === 'sequence') {
            return rule;
        } else {
            return {
                type: 'sequence',
                children: [rule]
            };
        }
    }

    function toBnfChoice(rule: EbnfProduction): BnfChoice {
        if (rule.type === 'reference') {
            return {
                type: 'choice',
                children: [rule]
            };
        } else if (rule.type === 'choice') {
            return {
                type: 'choice',
                children: rule.children
                    .map(toBnfChoice)
                    .reduce<BnfChoice['children']>((choices, choice) => [...choices, ...choice.children], [])
            };
        } else if (rule.type === 'optional') {
            const newNonTerminal = `O${newNonTerminalCounter++}`;
            newGrammarRules[newNonTerminal] = {
                type: 'choice',
                children: [
                    { type: 'empty' },
                    ...toBnfChoice(rule.child).children
                ]
            };
            return {
                type: 'choice',
                children: [{ type: 'reference', name: newNonTerminal }]
            };
        } else if (rule.type === 'repeat') {
            const newNonTerminal = `R${newNonTerminalCounter++}`;
            newGrammarRules[newNonTerminal] = {
                type: 'choice',
                children: [
                    { type: 'empty' },
                    ...toBnfChoice(rule.child).children.map<BnfSequence>((child) => {
                        return {
                            type: 'sequence',
                            children: [
                                { type: 'reference', name: newNonTerminal },
                                ...toBnfSequence(child).children
                            ]
                        };
                    })
                ]
            };
            return {
                type: 'choice',
                children: [{ type: 'reference', name: newNonTerminal }]
            };
        } else if (rule.type === 'sequence') {
            const newSequences = rule.children
                .map(toBnfChoice)
                .map((choice) => choice.children
                    .map(toBnfSequence)
                    .map((sequence) => sequence.children)
                )
                .reduce((previousSequences, nextSequences) => {
                    const newSequences: BnfSequence['children'][] = [];
                    for (const previousSequence of previousSequences) {
                        for (const nextSequence of nextSequences) {
                            newSequences.push([...previousSequence, ...nextSequence]);
                        }
                    }
                    return newSequences;
                })
                .map<BnfSequence>((sequence) => {
                    return {
                        type: 'sequence',
                        children: sequence
                    };
                });
            return {
                type: 'choice',
                children: newSequences
            };
        } else {
            return {
                type: 'choice',
                children: [rule]
            };
        }
    }

    const newGrammar: BnfGrammar = {};
    for (const nonTerminal of Object.keys(grammar)) {
        newGrammar[nonTerminal] = toBnfChoice(grammar[nonTerminal]);
    }
    for (const nonTerminal of Object.keys(newGrammarRules)) {
        newGrammar[nonTerminal] = newGrammarRules[nonTerminal];
    }
    return newGrammar;
}

function stringifyProduction(rule: EbnfProduction): string {
    if (rule.type === 'empty') {
        return 'ε';
    } else if (rule.type === 'choice') {
        return rule.children.length >= 1
            ? rule.children.map(stringifyProduction).join(' | ')
            : '∅';
    } else if (rule.type === 'optional') {
        return `[${stringifyProduction(rule.child)}]`;
    } else if (rule.type === 'reference') {
        return rule.name;
    } else if (rule.type === 'repeat') {
        return `{${stringifyProduction(rule.child)}}`;
    } else if (rule.type === 'sequence') {
        return rule.children.length >= 1
            ? rule.children.map(stringifyProduction).join(' ')
            : 'ε';
    } else {
        return rule.character;
    }
}

function printGrammar(grammar: EbnfGrammar) {
    for (const nonTerminal of Object.keys(grammar)) {
        console.log(`${nonTerminal} -> ${stringifyProduction(grammar[nonTerminal])}`);
    }
}

function removeLeftRecursion(grammar: BnfGrammar): BnfGrammar {
    const nonTerminals = Object.keys(grammar);
    const newGrammar: BnfGrammar = {};

    function toBnfChoice(rule: BnfProduction): BnfChoice {
        if (rule.type === 'choice') {
            return rule;
        } else {
            return { type: 'choice', children: [rule] };
        }
    }

    function toBnfSequence(rule: BnfChoice['children'][number]): BnfSequence {
        if (rule.type === 'sequence') {
            return rule;
        } else {
            return { type: 'sequence', children: [rule] };
        }
    }

    function isReachable(rule: BnfProduction, nonTerminal: string): boolean {
        if (rule.type === 'choice') {
            return rule.children.some((child) => isReachable(child, nonTerminal));
        } else if (rule.type === 'empty') {
            return false;
        } else if (rule.type === 'reference') {
            return rule.name === nonTerminal;
        } else if (rule.type === 'sequence') {
            return rule.children.some((child) => isReachable(child, nonTerminal));
        } else {
            return false;
        }
    }

    function removeDirectLeftRecursion(sequences: BnfSequence['children'][], nonTerminal: string): [BnfSequence['children'][], BnfSequence['children'][]] {
        const newSequencesA: BnfSequence['children'][] = [];
        const newSequencesB: BnfSequence['children'][] = [];

        for (const sequence of sequences) {
            const [first, ...rest] = sequence;
            if (first.type === 'reference' && first.name === nonTerminal) {
                newSequencesB.push(rest);
                newSequencesB.push([...rest, { type: 'reference', name: `${nonTerminal}'` }]);
            } else {
                newSequencesA.push(sequence);
                newSequencesA.push([...sequence, { type: 'reference', name: `${nonTerminal}'` }]);
            }
        }

        return [newSequencesA, newSequencesB];
    }

    for (let i = 0; i < nonTerminals.length; i++) {
        const oldSequencesA = toBnfChoice(grammar[nonTerminals[i]]).children.map(toBnfSequence).map((sequence) => sequence.children);
        const newSequencesA = [...oldSequencesA];
        for (let j = 0; j < i; j++) {
            const sequencesB = toBnfChoice(grammar[nonTerminals[j]]).children.map(toBnfSequence);
            for (const oldSequenceA of oldSequencesA) {
                const [first, ...rest] = oldSequenceA;
                if (first.type === 'reference' && first.name === nonTerminals[j] && isReachable(grammar[nonTerminals[j]], nonTerminals[i])) {
                    const index = newSequencesA.indexOf(oldSequenceA);
                    newSequencesA.splice(index, 1, ...sequencesB.map((sequencesB) => [...sequencesB.children, ...rest]));
                }
            }
        }

        const [sequencesA, sequencesB] = removeDirectLeftRecursion(newSequencesA, nonTerminals[i]);

        if (sequencesB.length >= 1) {
            newGrammar[nonTerminals[i]] = {
                type: 'choice',
                children: sequencesA.map<BnfSequence>((sequence) => {
                    return {
                        type: 'sequence',
                        children: sequence
                    };
                })
            };
            newGrammar[`${nonTerminals[i]}'`] = {
                type: 'choice',
                children: sequencesB.map<BnfSequence>((sequence) => {
                    return {
                        type: 'sequence',
                        children: sequence
                    };
                })
            };
        } else {
            newGrammar[nonTerminals[i]] = {
                type: 'choice',
                children: newSequencesA.map<BnfSequence>((sequence) => {
                    return {
                        type: 'sequence',
                        children: sequence
                    };
                })
            };
        }
    }

    return newGrammar;
}

function simplifyChoiceChild(rule: BnfChoice['children'][number]): BnfChoice['children'][number] {
    if (rule.type === 'sequence') {
        const children = rule.children;
        if (children.length === 0) {
            return { type: 'empty' };
        } else if (children.length === 1) {
            return children[0];
        } else {
            return {
                type: 'sequence',
                children
            };
        }
    } else {
        return rule;
    }
}

function simplifyRule(rule: BnfProduction): BnfProduction {
    if (rule.type === 'choice') {
        const children = rule.children.map(simplifyChoiceChild);
        if (children.length === 1) {
            return children[0];
        } else {
            return {
                type: 'choice',
                children
            };
        }
    } else {
        return simplifyChoiceChild(rule);
    }
}

function simplifyBnf(grammar: BnfGrammar): BnfGrammar {
    const newGrammar: BnfGrammar = {};
    for (const nonTerminal of Object.keys(grammar)) {
        newGrammar[nonTerminal] = simplifyRule(grammar[nonTerminal]);
    }

    return newGrammar;
}

function normalizeBnfChoiceChild(rule: BnfChoice['children'][number]): BnfSequence {
    if (rule.type === 'sequence') {
        return rule;
    } else {
        return {
            type: 'sequence',
            children: [rule]
        };
    }
}

function normalizeBnfRule(rule: BnfProduction): NormalizedBnfChoice {
    if (rule.type === 'choice') {
        return {
            type: 'choice',
            children: rule.children.map(normalizeBnfChoiceChild)
        };
    } else {
        return {
            type: 'choice',
            children: [normalizeBnfChoiceChild(rule)]
        };
    }
}

function normalizeBnf(grammar: BnfGrammar): NormalizedBnfGrammar {
    const newGrammar: NormalizedBnfGrammar = {};
    for (const nonTerminal of Object.keys(grammar)) {
        newGrammar[nonTerminal] = normalizeBnfRule(grammar[nonTerminal]);
    }

    return newGrammar;
}

function createTerminal(character: string): Terminal {
    return { type: 'terminal', character };
}

const letter: Choice = {
    type: 'choice',
    children: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').map(createTerminal)
};

const digit: Choice = {
    type: 'choice',
    children: '0123456789'.split('').map(createTerminal)
};

const identifier: Sequence = {
    type: 'sequence',
    children: [
        { type: 'reference', name: 'letter' },
        {
            type: 'repeat',
            child: {
                type: 'choice',
                children: [
                    { type: 'reference', name: 'letter' },
                    { type: 'reference', name: 'digit' },
                    { type: 'terminal', character: '_' }
                ]
            }
        }
    ]
};

const value: Sequence = {
    type: 'sequence',
    children: [
        { type: 'reference', name: 'digit' },
        {
            type: 'repeat',
            child: { type: 'reference', name: 'digit' }
        }
    ]
};

const expression: Choice = {
    type: 'choice',
    children: [
        {
            type: 'sequence',
            children: [
                { type: 'reference', name: 'expression' },
                { type: 'terminal', character: '*' },
                { type: 'reference', name: 'expression' }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'reference', name: 'expression' },
                { type: 'terminal', character: '+' },
                { type: 'reference', name: 'expression' }
            ]
        },
        { type: 'reference', name: 'identifier' },
        { type: 'reference', name: 'value' }
    ]
};

const assignment: Sequence = {
    type: 'sequence',
    children: [
        { type: 'reference', name: 'identifier' },
        { type: 'terminal', character: '=' },
        { type: 'reference', name: 'expression' },
        { type: 'terminal', character: ';' }
    ]
};

const statements: Repeat = {
    type: 'repeat',
    child: {
        type: 'reference',
        name: 'assignment'
    }
};

const grammar: EbnfGrammar = {
    letter,
    digit,
    identifier,
    value,
    expression,
    assignment,
    statements
};
const bnfGrammar = normalizeBnf(simplifyBnf(removeLeftRecursion(toBnf(grammar))));

const input = `A=1+2;B=A+3;C=1*2+3*4;`;

// interface ParseTreeState {
//     sequence: BnfSequence;
//     index: number;
// }

// const parseTreeStates: ParseTreeState[] = [{
//     sequence: { type: 'sequence', children: [{ type: 'reference', name: 'statements' }] },
//     index: 0
// }];

// for (let i = 0; i < input.length; i++) {
//     // Make queue of pending parse tree states, initialize with previously finished/advanced parse tree states
//     const pendingParseTreeStates = parseTreeStates;
//     // Make empty list of finished/advanced parse tree states
//     const nextParseTreeStates: ParseTreeState[] = [];
//     while (pendingParseTreeStates.length >= 1) {
//         // Pop and advance a parseTreeState from the queue
//         const parseTreeState = pendingParseTreeStates.pop()!;

//         // Add any new pending parse tree states to the queue (in case of choice), check if it doesn't exist yet (in the finished/advanced list)
//         // Add "advanced" (by 1 step) parse tree states to finished/advanced list
//         // Discard reject parse tree states
//     }
// }

// function nextParseTree(grammar: NormalizedBnfGrammar, state: ParseTreeState): ParseTreeState[] {

// }

interface AcceptingParseState {
    type: 'accepting';
    position: number;
    input: string;
}

interface PendingParseState {
    type: 'pending';
    rule: BnfChoice['children'][number];
    accepted: AcceptingParseState[];
}

interface EmptyParseState {
    type: 'empty';
}

interface RejectingParseState {
    type: 'rejecting';
}

type ParseState = AcceptingParseState | PendingParseState | EmptyParseState | RejectingParseState;

function bnfChoiceChildEquals(a: BnfChoice['children'][number], b: BnfChoice['children'][number]): boolean {
    if (a.type === 'empty' && b.type === 'empty') {
        return true;
    } else if (a.type === 'reference' && b.type === 'reference' && a.name === b.name) {
        return true;
    } else if (a.type === 'terminal' && b.type === 'terminal' && a.character === b.character) {
        return true;
    } else if (a.type === 'sequence' && b.type === 'sequence' && a.children.length === b.children.length) {
        for (let i = 0; i < a.children.length; i++) {
            if (!bnfChoiceChildEquals(a.children[i], b.children[i])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

function accept(grammar: BnfGrammar, rule: BnfProduction, input: string, position: number): ParseState[] {
    switch (rule.type) {
        case 'choice':
            return rule.children
                .map((child) => accept(grammar, child, input, position))
                .reduce((accumulator, next) => [...accumulator, ...next], []);
        case 'empty':
            return [{ type: 'empty' }];
        case 'reference':
            return accept(grammar, grammar[rule.name], input, position);
        case 'sequence': {
            if (rule.children.length === 0) {
                return [{ type: 'empty' }];
            } else if (rule.children.length === 1) {
                return accept(grammar, rule.children[0], input, position);
            } else {
                const remaining: BnfSequence = { type: 'sequence', children: rule.children.slice(1) };
                return accept(grammar, rule.children[0], input, position).map<ParseState[]>((state) => {
                    if (state.type === 'rejecting') {
                        return [state];
                    } else if (state.type === 'empty') {
                        return accept(grammar, remaining, input, position);
                    } else if (state.type === 'accepting') {
                        return [{
                            type: 'pending',
                            rule: remaining,
                            accepted: [state]
                        }];
                    } else {
                        if (state.rule.type === 'sequence') {
                            return [{
                                type: 'pending',
                                rule: { type: 'sequence', children: [...state.rule.children, ...remaining.children] },
                                accepted: state.accepted
                            }];
                        } else {
                            return [{
                                type: 'pending',
                                rule: { type: 'sequence', children: [state.rule, ...remaining.children] },
                                accepted: state.accepted

                            }];
                        }
                    }
                }).reduce((accumulator, next) => [...accumulator, ...next], []);
            }
        }
        case 'terminal':
            if (rule.character === input) {
                return [{ type: 'accepting', position, input }];
            } else {
                return [{ type: 'rejecting' }];
            }
    }
}

// interface TreeNode {
//     type: 'node';
//     nonTerminal: string;
//     rule: BnfProduction;
// }

// function consume(grammar: BnfGrammar, rule: BnfProduction, input: string) {
//     switch (rule.type) {
//         case 'choice': {
//             rule.children.map((child) => consume(grammar, child, input));
//         }
//         case 'empty': {

//         }
//         case 'reference': {

//         }
//     }
// }

printGrammar(grammar);
console.log('-------------------------------------');
printGrammar(toBnf(grammar));
console.log('-------------------------------------');
printGrammar(removeLeftRecursion(toBnf(grammar)));

// console.log(parse(bnfGrammar, bnfGrammar.rules, input.split(''), 0));

function dedupe<T>(array: T[], test: (a: T, b: T) => boolean): T[] {
    const items: T[] = [];
    for (const a of array) {
        if (items.every((b) => !test(a, b))) {
            items.push(a);
        }
    }
    return items;
}

const tokens = input.split('');
let parseStates: PendingParseState[];

parseStates = bnfGrammar.statements.children.map<PendingParseState>((rule) => {
    return {
        type: 'pending',
        rule,
        accepted: []
    };
});

const start = perfHooks.performance.now();
for (let i = 0; i < tokens.length; i++) {
    console.log('-------------------------------------');
    console.log(`Consuming: ${tokens.slice(0, i + 1).join('')}`);
    const newParseStates: PendingParseState[] = [];
    for (const parseState of parseStates) {
        console.log(`Old: ${stringifyProduction(parseState.rule)}`);
        const nextNewParseStates = accept(bnfGrammar, parseState.rule, tokens[i], i);
        for (const nextNewParseState of nextNewParseStates) {
            if (nextNewParseState.type === 'pending') {
                newParseStates.push(nextNewParseState);
                console.log(`    New: ${stringifyProduction(nextNewParseState.rule)}`);
            }
        }
    }

    if (2 < 1) {
        dedupe(newParseStates.map((state) => state.rule).map(simplifyChoiceChild), bnfChoiceChildEquals);
    }

    parseStates = newParseStates;
}
const end = perfHooks.performance.now();
console.log(`Took ${end - start}ms.`);

for (const parseState of parseStates) {
    console.log(stringifyProduction(parseState.rule));
    console.log(JSON.stringify(parseState.accepted));
}

// console.log(accept(bnfGrammar, bnfGrammar.rules, input.split('')));
