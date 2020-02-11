import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { RuleNode } from './rule-node';
import { Dot } from './dot';

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
        childNodes: null
    };
});

function expandTerminalRules(nodes: RuleNode[], token: string): RuleNode[] {
    const nextNodes: RuleNode[] = [];
    for (const node of nodes) {
        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        const term = sequence[node.termIndex];

        if (term.type === 'terminal') {
            if (term.terminal === token) {
                nextNodes.push({
                    nonTerminal: node.nonTerminal,
                    sequenceIndex: node.sequenceIndex,
                    termIndex: node.termIndex + 1,
                    childNodes: null
                });
            }
        }
    }

    return nextNodes;
}

function expandNonTerminalRules(nodes: RuleNode[]): RuleNode[] {
    const nextNodes: RuleNode[] = [];
    for (const node of nodes) {
        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex >= sequence.length) {
            nextNodes.push(node);
            continue;
        }

        const term = sequence[node.termIndex];
        if (term.type !== 'non-terminal') {
            nextNodes.push(node);
            continue;
        }

        const sequences = grammar[term.name];
        const childNodes = sequences.map((sequence, index): RuleNode => {
            return {
                nonTerminal: term.name,
                sequenceIndex: index,
                childNodes: null,
                termIndex: 0
            };
        });

        nextNodes.push({
            nonTerminal: node.nonTerminal,
            sequenceIndex: node.sequenceIndex,
            termIndex: node.termIndex,
            childNodes: expandNonTerminalRules(childNodes)
        });
    }

    return nextNodes;
}

function acceptToken(nodes: RuleNode[], token: string): RuleNode[] {
    let nextNodes = nodes.slice();
    nextNodes = expandTerminalRules(nextNodes, token);
    nextNodes = expandNonTerminalRules(nextNodes);
    return nextNodes;
}

let currentRootNodes = initialRootNodes;

console.log('--- first rule tree ---');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- second rule tree ---');
currentRootNodes = acceptToken(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));
