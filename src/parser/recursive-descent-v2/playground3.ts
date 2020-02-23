import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { Node } from './node';
import { Dot } from './dot';
import { DAG } from './dag';

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

const dag = new DAG();
for (const initialNode of initialNodes) {
    dag.addOrFind(initialNode);
}

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

function step(states: Node[][], token: string, tokenIndex: number) {
    const nodes = states[tokenIndex];
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
                        ...node,
                        termIndex: node.termIndex + 1
                    };
                    addIfNotExists(nodes, newNode);
                    addIfNotExists(remaining, newNode);
                    addIfNotExists(nextNodes, newNode);
                    const original = dag.addOrFind(node);
                    const parents = dag.getParents(original);
                    const child = dag.addOrFind(newNode);
                    if (parents) {
                        for (const parent of parents) {
                            dag.setChild(parent, child);
                        }
                    }
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
                    const parent = dag.addOrFind(node);
                    const child = dag.addOrFind(newNode);
                    dag.setChild(parent, child);
                }
            }
        } else {
            const previous = states[node.startIndex];
            for (const previousNode of previous) {
                const previousSequence = grammar[previousNode.nonTerminal][previousNode.sequenceIndex];
                if (previousNode.termIndex < previousSequence.length) {
                    const previousTerm = previousSequence[previousNode.termIndex];
                    if (previousTerm.type === 'non-terminal' && previousTerm.name === node.nonTerminal) {
                        const completedNode: Node = {
                            ...previousNode,
                            termIndex: previousNode.termIndex + 1
                        };
                        addIfNotExists(nodes, completedNode);
                        addIfNotExists(remaining, completedNode);
                        const parent = dag.addOrFind(completedNode);
                        const child = dag.addOrFind(node);
                        dag.setChild(parent, child);
                    }
                }
            }
        }
    }
    states.push(nextNodes);
}

function printState(nodes: Node[]) {
    for (const node of nodes) {
        const sequence = Printer.stringifySequence(grammar[node.nonTerminal][node.sequenceIndex], node.termIndex);
        console.log(`${node.nonTerminal} -> ${sequence}`);
    }
}

function printStates(states: Node[][]) {
    for (const nodes of states) {
        console.log('--- next states ---');
        printState(nodes);
    }
}

const states = [initialNodes];
step(states, 'a', 0);
step(states, '+', 1);
step(states, 'a', 2);
step(states, '+', 3);
step(states, 'a', 4);

printStates(states);

console.log('--- state dag ---');
console.log(Dot.toDot(grammar, dag));
