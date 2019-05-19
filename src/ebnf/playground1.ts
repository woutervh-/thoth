export const module = true;

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

const symbol: Choice = {
    type: 'choice',
    children: `[]{}()<>'"=|.,;`.split('').map(createTerminal)
};

const character: Choice = {
    type: 'choice',
    children: [
        { type: 'reference', name: 'letter' },
        { type: 'reference', name: 'digit' },
        { type: 'reference', name: 'symbol' },
        { type: 'terminal', character: '_' }
    ]
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

const terminal: Choice = {
    type: 'choice',
    children: [
        {
            type: 'sequence',
            children: [
                { type: 'terminal', character: `'` },
                { type: 'reference', name: 'character' },
                { type: 'repeat', child: { type: 'reference', name: 'character' } },
                { type: 'terminal', character: `'` }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'terminal', character: '"' },
                { type: 'reference', name: 'character' },
                { type: 'repeat', child: { type: 'reference', name: 'character' } },
                { type: 'terminal', character: '"' }
            ]
        }
    ]
};

const lhs: Reference = { type: 'reference', name: 'identifier' };

const rhs: Choice = {
    type: 'choice',
    children: [
        {
            type: 'sequence',
            children: [
                { type: 'terminal', character: '[' },
                { type: 'reference', name: 'rhs' },
                { type: 'terminal', character: ']' }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'terminal', character: '{' },
                { type: 'reference', name: 'rhs' },
                { type: 'terminal', character: '}' }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'terminal', character: '(' },
                { type: 'reference', name: 'rhs' },
                { type: 'terminal', character: ')' }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'reference', name: 'rhs' },
                { type: 'terminal', character: ',' },
                { type: 'reference', name: 'rhs' }
            ]
        },
        {
            type: 'sequence',
            children: [
                { type: 'reference', name: 'rhs' },
                { type: 'terminal', character: '|' },
                { type: 'reference', name: 'rhs' }
            ]
        },
        { type: 'reference', name: 'identifier' },
        { type: 'reference', name: 'terminal' }
    ]
};

const rule: Sequence = {
    type: 'sequence',
    children: [
        { type: 'reference', name: 'lhs' },
        { type: 'terminal', character: '=' },
        { type: 'reference', name: 'rhs' },
        { type: 'terminal', character: ';' }
    ]
};

const rules: Repeat = {
    type: 'repeat',
    child: {
        type: 'reference',
        name: 'rule'
    }
};

const grammar: EbnfGrammar = {
    letter,
    digit,
    symbol,
    character,
    identifier,
    terminal,
    lhs,
    rhs,
    rule,
    rules
};

const input = `E=E,'^',E|'-',E|E,('*'|'/'),E|E,('+'|'-'),E|ID|NUMBER;S=ID,'=',E,';';P={S}`;
let indent = '';

function parseTerminal(terminal: Terminal, input: string[], position: number) {
    if (input[position] === terminal.character) {
        return 1;
    } else {
        return -1;
    }
}

function parseChoice(grammar: EbnfGrammar, rule: Choice, input: string[], position: number) {
    for (const child of rule.children) {
        const advance = parse(grammar, child, input, position);
        if (advance >= 0) {
            return advance;
        }
    }
    return -1;
}

function parseReference(grammar: EbnfGrammar, rule: Reference, input: string[], position: number) {
    console.log(`${indent}${rule.name}`);
    indent += '  ';
    const result = parse(grammar, grammar[rule.name], input, position);
    indent = indent.substr(2);
    return result;
}

function parseRepeat(grammar: EbnfGrammar, rule: Repeat, input: string[], position: number) {
    let advance = 0;
    while (true) {
        const next = parse(grammar, rule.child, input, position + advance);
        if (next >= 0) {
            advance += next;
        } else {
            break;
        }
    }
    return advance;
}

function parseSequence(grammar: EbnfGrammar, rule: Sequence, input: string[], position: number) {
    let advance = 0;
    for (const child of rule.children) {
        const next = parse(grammar, child, input, position + advance);
        if (next >= 0) {
            advance += next;
        } else {
            return -1;
        }
    }
    return advance;
}

function parseOptional(grammar: EbnfGrammar, rule: Optional, input: string[], position: number) {
    const advance = parse(grammar, rule.child, input, position);
    if (advance >= 0) {
        return advance;
    } else {
        return 0;
    }
}

function parseEmpty() {
    return 0;
}

function parse(grammar: EbnfGrammar, rule: EbnfProduction, input: string[], position: number): number {
    switch (rule.type) {
        case 'choice': return parseChoice(grammar, rule, input, position);
        case 'empty': return parseEmpty();
        case 'optional': return parseOptional(grammar, rule, input, position);
        case 'reference': return parseReference(grammar, rule, input, position);
        case 'repeat': return parseRepeat(grammar, rule, input, position);
        case 'sequence': return parseSequence(grammar, rule, input, position);
        case 'terminal': return parseTerminal(rule, input, position);
    }
}

printGrammar(grammar);
console.log('-------------------------------------');
printGrammar(toBnf(grammar));
console.log('-------------------------------------');
printGrammar(removeLeftRecursion(toBnf(grammar)));

console.log(parse(removeLeftRecursion(toBnf(grammar)), rules, input.split(''), 0));
