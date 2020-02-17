import * as perf_hooks from 'perf_hooks';
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
        startIndex: 0,
        endIndex: 0
    };
});
const dag = new DAG.DAG();
for (const node of initialRootNodes) {
    dag.addNode(node);
}

function topDownWalk(action: (node: DAG.Node) => void, order: 'pre' | 'post') {
    const seen = new Set<DAG.Node>();

    function recurse(node: DAG.Node) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);
        if (order === 'pre') {
            action(node);
        }
        const children = dag.getChildren(node);
        if (children) {
            for (const child of children) {
                recurse(child);
            }
        }
        if (order === 'post') {
            action(node);
        }
    }

    const roots = dag.getRootNodes();
    for (const root of roots) {
        recurse(root);
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
            startIndex: node.endIndex,
            endIndex: node.endIndex
        };
        return dag.addOrFind(child);
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
        const children = dag.getChildren(node);
        if (!children) {
            dag.destroyNode(node);
        }
        return;
    }

    if (term.terminal !== token) {
        dag.destroyNode(node);
        return;
    }

    node.termIndex += 1;
    node.endIndex += 1;
};

const splitCompleted = (node: DAG.Node) => {
    const children = dag.getChildren(node);
    if (!children) {
        return;
    }

    const parents = dag.getParents(node);
    for (const child of children) {
        const sequence = grammar[child.nonTerminal][child.sequenceIndex];
        if (child.termIndex < sequence.length) {
            continue;
        }

        const clone: DAG.Node = dag.addOrFind({
            nonTerminal: node.nonTerminal,
            sequenceIndex: node.sequenceIndex,
            termIndex: node.termIndex + 1,
            startIndex: node.startIndex,
            endIndex: child.endIndex
        });

        if (parents) {
            for (const parent of parents) {
                dag.setChild(parent, clone);
            }
        }
    }
};

function step(token: string) {
    topDownWalk(expandNonTerminal, 'pre');
    topDownWalk(acceptToken(token), 'post')
    topDownWalk(splitCompleted, 'post');
}

console.log('--- initial DAG ---');
console.log(Dot.toDot(grammar, dag));

// -------------------------------

const start = perf_hooks.performance.now();
const tokens = 'a*a-a*a;'.split('');
for (const token of tokens) {
    step(token);
    console.log('--- next DAG ---');
    console.log(Dot.toDot(grammar, dag));
}
const end = perf_hooks.performance.now();

console.log(`Took ${end - start} ms.`);
