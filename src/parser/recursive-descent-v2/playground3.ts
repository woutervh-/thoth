import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { Node } from './node';
import { Dot } from './dot';

let grammar: Grammar<string> = {
    E: [
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '+' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: 'a' }]
    ]
};
const startSymbol = 'E';

console.log('--- original ---');
Printer.printGrammar(grammar);

grammar = Recursion.removeAllLeftRecursion(grammar);
console.log('--- removed left-recursion ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeEmptyRules(grammar);
console.log('--- remove empty non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.substituteSimpleNonTerminals(grammar);
console.log('--- substitute simple non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeUnreachables(grammar, [startSymbol]);
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);

const initialNodes = grammar[startSymbol].map((sequence, index): Node => {
    return {
        nonTerminal: startSymbol,
        sequenceIndex: index,
        termIndex: 0,
        startIndex: 0
    };
});

function addIfNotExists(nodes: Node[], node: Node) {
    const found = nodes.find((nodeB) => {
        return node.nonTerminal === nodeB.nonTerminal
            && node.sequenceIndex === nodeB.sequenceIndex
            && node.termIndex === nodeB.termIndex
            && node.startIndex === nodeB.startIndex
    });
    if (!found) {
        nodes.push(node);
    }
}

function step(nodes: Node[], token: string, tokenIndex: number) {
    const remaining = nodes.slice();
    const nextNodes: Node[] = [];
    while (remaining.length >= 1) {
        const node = remaining.pop()!;
        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex < sequence.length) {
            const term = sequence[node.termIndex];
            if (term.type === 'terminal') {
                if (term.terminal === token) {
                    const newNode: Node = {
                        nonTerminal: node.nonTerminal,
                        sequenceIndex: node.sequenceIndex,
                        termIndex: node.termIndex + 1,
                        startIndex: node.startIndex
                    };
                    addIfNotExists(nextNodes, newNode);
                }
            } else {
                const sequences = grammar[term.name];
                const newNodes = sequences.map((sequence, index): Node => {
                    return {
                        nonTerminal: term.name,
                        sequenceIndex: index,
                        termIndex: 0,
                        startIndex: tokenIndex
                    };
                });
                for (const newNode of newNodes) {
                    addIfNotExists(remaining, newNode);
                }
            }
        } else {
            for (const node of )
        }
    }
    return nextNodes;
}

let currentNodes = initialNodes;
step(currentNodes, 'a', 0);
