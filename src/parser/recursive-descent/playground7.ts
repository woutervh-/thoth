import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import * as DAG from './dag';
import { Dot } from './dot';

let grammar: Grammar<string> = {
    S: [
        [{ type: 'non-terminal', name: 'S' }, { type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: ';' }],
        []
    ],
    E: [
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '^' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '*' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: 'a' }]
    ]
};
const startSymbol = 'S';

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

const initialRootNodes = grammar[startSymbol].map((sequence, index): DAG.Node => {
    return {
        nonTerminal: startSymbol,
        sequenceIndex: index,
        termIndex: 0,
        tokenIndex: 0
    };
});
const dag = new DAG.DAG();
for (const node of initialRootNodes) {
    dag.addNode(node);
}

function dfsWalk(action: (node: DAG.Node) => void, order: 'pre' | 'post') {
    const seen = new Set<DAG.Node>();
    const remaining = dag.getRootNodes();
    while (remaining.length >= 1) {
        const node = remaining.pop()!;
        if (seen.has(node)) {
            continue;
        }
        seen.add(node);

        if (order === 'pre') {
            action(node);
        }

        const children = dag.getChildren(node);
        if (children) {
            remaining.push(...children);
        }

        if (order === 'post') {
            action(node);
        }
    }
}

const expandNonTerminal = (node: DAG.Node) => {
    const sequence = grammar[node.nonTerminal][node.sequenceIndex];
    if (node.termIndex >= sequence.length) {
        return;
    }

    const term = sequence[node.termIndex];
    if (term.type !== 'non-terminal') {
        return;
    }

    if (dag.hasChildren(node)) {
        return;
    }

    const children = grammar[term.name].map((sequence, index): DAG.Node => {
        let child: DAG.Node = {
            nonTerminal: term.name,
            sequenceIndex: index,
            termIndex: 0,
            tokenIndex: node.tokenIndex
        };
        const existing = dag.findNode(child);
        if (existing) {
            return existing;
        } else {
            dag.addNode(child);
            return child;
        }
    });

    for (const child of children) {
        dag.setChild(node, child);
    }
};

const acceptToken = (token: string) => (node: DAG.Node) => {
    const sequence = grammar[node.nonTerminal][node.sequenceIndex];
    if (node.termIndex >= sequence.length) {
        dag.destroyNode(node);
        return;
    }

    const term = sequence[node.termIndex];
    if (term.type !== 'terminal') {
        return;
    }

    if (term.terminal === token) {
        node.termIndex += 1;
        node.tokenIndex += 1;
        return;
    }

    dag.destroyNode(node);
};

const splitCompleted = (node: DAG.Node) => {
    const sequence = grammar[node.nonTerminal][node.sequenceIndex];
    if (node.termIndex < sequence.length) {
        return;
    }

    // TODO: split parents
    // One of them will remain as is.
    // The other will increase term index (by 1) + token index (by node.termIndex/node.tokenIndex/...?)
    // Split can happen multiple times (from multiple children).
};

console.log('--- initial DAG ---');
console.log(Dot.dagToDot(grammar, dag));

// -------------------------------

dfsWalk(expandNonTerminal, 'pre');
console.log('--- next DAG ---');
console.log(Dot.dagToDot(grammar, dag));

dfsWalk(acceptToken('a'), 'post');
console.log('--- next DAG ---');
console.log(Dot.dagToDot(grammar, dag));

dfsWalk(splitCompleted, 'post');
console.log('--- next DAG ---');
console.log(Dot.dagToDot(grammar, dag));

// // -------------------------------

// dfsWalk(expandNonTerminal, 'pre');
// console.log('--- next DAG ---');
// console.log(Dot.dagToDot(grammar, dag));

// dfsWalk(acceptToken(';'), 'post');
// console.log('--- next DAG ---');
// console.log(Dot.dagToDot(grammar, dag));

// // TODO: split parents of accepting nodes
// console.log('--- next DAG ---');
// console.log(Dot.dagToDot(grammar, dag));

// // -------------------------------
