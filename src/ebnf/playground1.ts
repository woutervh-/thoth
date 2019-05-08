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

type GrammarSymbol = Terminal | Reference | Sequence | Choice | Repeat;

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
    children: `[]{}()<>'''=|.,;`.split('').map(createTerminal)
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

interface Grammar {
    [Key: string]: GrammarSymbol;
}

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

function parse(grammar: Grammar, rule: GrammarSymbol, position: number): number {
    switch (rule.type) {
        case 'terminal': return parseTerminal(rule, position);
        case 'choice': return parseChoice(grammar, rule, position);
        case 'reference': return parseReference(grammar, rule, position);
        case 'repeat': return parseRepeat(grammar, rule, position);
        case 'sequence': return parseSequence(grammar, rule, position);
    }
}

console.log(parse(grammar, rules, 0));
