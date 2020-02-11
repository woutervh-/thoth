import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { RuleNode } from './rule-node';
import { Dot } from './dot';

function isNonNullable<T>(object: T): object is NonNullable<T> {
    return object !== undefined && object !== null;
}

let grammar: Grammar<string> = {
    E: [
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '^' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '*' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: 'a' }]
    ]
};

console.log('--- original ---');
Printer.printGrammar(grammar);

grammar = Recursion.removeAllLeftRecursion(grammar);
console.log('--- removed left-recursion ---');
Printer.printGrammar(grammar);

// grammar = Deterministic.leftFactor(grammar);
// console.log('--- left-factored ---');
// Printer.printGrammar(grammar);

grammar = Minimizer.removeEmptyRules(grammar);
console.log('--- remove empty non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.substituteSimpleNonTerminals(grammar);
console.log('--- substitute simple non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeUnreachables(grammar, ['E']);
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);

const startSymbol = 'E';
const initialRootNodes = grammar[startSymbol].map((sequence, index): RuleNode => {
    return {
        nonTerminal: startSymbol,
        sequenceIndex: index,
        termIndex: 0,
        tokenIndex: 0,
        childNodes: null
    };
});

function acceptToken(node: RuleNode, token: string): RuleNode | null {
    const sequence = grammar[node.nonTerminal][node.sequenceIndex];

    if (node.termIndex >= sequence.length) {
        // Sequence has run out of symbols and cannot accept any more tokens.
        return null;
    }

    const term = sequence[node.termIndex];
    if (term.type === 'terminal') {
        return {
            ...node,
            termIndex: node.termIndex + 1
        };
    } else {
        let childNodes: RuleNode[];
        if (node.childNodes) {
            childNodes = node.childNodes;
        } else {
            childNodes = grammar[term.name].map<RuleNode>((sequence, index) => {
                return {
                    nonTerminal: term.name,
                    sequenceIndex: index,
                    termIndex: 0,
                    tokenIndex: node.tokenIndex,
                    childNodes: null
                };
            });
        }

        for (const child of childNodes) {
            const sequence = grammar[child.nonTerminal][child.sequenceIndex];
            if (child.termIndex >= sequence.length) {
                
            }
        }
    }
}

function acceptToken(nodes: RuleNode[], token: string): RuleNode[] {

}

let currentRootNodes = initialRootNodes;

console.log('--- first rule tree ---');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- second rule tree ---');
currentRootNodes = acceptToken(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- third rule tree ---');
currentRootNodes = acceptToken(currentRootNodes, '*');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- fourth rule tree ---');
currentRootNodes = acceptToken(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- fifth rule tree ---');
currentRootNodes = acceptToken(currentRootNodes, '-');
console.log(Dot.toDot(grammar, currentRootNodes));
