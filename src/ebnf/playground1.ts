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
    children: GrammarSymbol[];
}

interface Choice {
    type: 'choice';
    children: GrammarSymbol[];
}

interface Repeat {
    type: 'repeat';
    child: GrammarSymbol;
}

interface Optional {
    type: 'optional';
    child: GrammarSymbol;
}

interface Empty {
    type: 'empty';
}

type GrammarSymbol = Terminal | Reference | Sequence | Choice | Repeat | Optional | Empty;

interface Grammar {
    [Key: string]: GrammarSymbol;
}

interface BnfReference {
    type: 'reference';
    name: string;
    original?: Reference;
}

interface BnfSequence {
    type: 'sequence';
    children: (Terminal | BnfReference | Empty)[];
}

interface BnfChoice {
    type: 'choice';
    children: (BnfSequence | Terminal | BnfReference | Empty)[];
}

type BnfGrammarSymbol = BnfChoice | BnfSequence | Terminal | BnfReference | Empty;

interface BnfGrammar {
    [Key: string]: BnfGrammarSymbol;
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

const grammar: Grammar = {
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
const characters = input.split('');
let indent = '';

function parseTerminal(terminal: Terminal, position: number) {
    if (characters[position] === terminal.character) {
        return 1;
    } else {
        return -1;
    }
}

function parseChoice(grammar: Grammar, rule: Choice, position: number) {
    for (const child of rule.children) {
        const advance = parse(grammar, child, position);
        if (advance >= 0) {
            return advance;
        }
    }
    return -1;
}

function parseReference(grammar: Grammar, rule: Reference, position: number) {
    console.log(`${indent}${rule.name}`);
    indent += '  ';
    const result = parse(grammar, grammar[rule.name], position);
    indent = indent.substr(2);
    return result;
}

function parseRepeat(grammar: Grammar, rule: Repeat, position: number) {
    let advance = 0;
    while (true) {
        const next = parse(grammar, rule.child, position + advance);
        if (next >= 0) {
            advance += next;
        } else {
            break;
        }
    }
    return advance;
}

function parseSequence(grammar: Grammar, rule: Sequence, position: number) {
    let advance = 0;
    for (const child of rule.children) {
        const next = parse(grammar, child, position + advance);
        if (next >= 0) {
            advance += next;
        } else {
            return -1;
        }
    }
    return advance;
}

function parseOptional(grammar: Grammar, rule: Optional, position: number) {
    const advance = parse(grammar, rule.child, position);
    if (advance >= 0) {
        return advance;
    } else {
        return 0;
    }
}

function parseEmpty() {
    return 0;
}

function parse(grammar: Grammar, rule: GrammarSymbol, position: number): number {
    switch (rule.type) {
        case 'choice': return parseChoice(grammar, rule, position);
        case 'empty': return parseEmpty();
        case 'optional': return parseOptional(grammar, rule, position);
        case 'reference': return parseReference(grammar, rule, position);
        case 'repeat': return parseRepeat(grammar, rule, position);
        case 'sequence': return parseSequence(grammar, rule, position);
        case 'terminal': return parseTerminal(rule, position);
    }
}

function toBnf(grammar: Grammar): BnfGrammar {
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

    function toBnfChoice(rule: GrammarSymbol): BnfChoice {
        if (rule.type === 'reference') {
            return {
                type: 'choice',
                children: [
                    {
                        type: 'reference',
                        name: rule.name,
                        original: rule
                    }
                ]
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

function stringifyGrammarSymbol(rule: GrammarSymbol): string {
    if (rule.type === 'empty') {
        return 'ε';
    } else if (rule.type === 'choice') {
        return rule.children.map(stringifyGrammarSymbol).join(' | ');
    } else if (rule.type === 'optional') {
        return `[${stringifyGrammarSymbol(rule.child)}]`;
    } else if (rule.type === 'reference') {
        return rule.name;
    } else if (rule.type === 'repeat') {
        return `{${stringifyGrammarSymbol(rule.child)}}`;
    } else if (rule.type === 'sequence') {
        return rule.children.map(stringifyGrammarSymbol).join(' ');
    } else {
        return rule.character;
    }
}

function printGrammar(grammar: Grammar) {
    for (const nonTerminal of Object.keys(grammar)) {
        console.log(`${nonTerminal} -> ${stringifyGrammarSymbol(grammar[nonTerminal])}`);
    }
}

printGrammar(grammar);
console.log('-------------------------------------');
printGrammar(toBnf(grammar));

// console.log(parse(grammar, rules, 0));
