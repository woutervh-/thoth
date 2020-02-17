import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { DAG } from './dag';
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

const initialRootNodes = grammar[startSymbol].map((sequence, index): Node => {
    return {
        nonTerminal: startSymbol,
        sequenceIndex: index,
        termIndex: 0,
        startIndex: 0,
        endIndex: 0
    };
});
const dag = new DAG();
for (const node of initialRootNodes) {
    dag.addOrFind(node);
}

function expand() {
    const seen = new Set<Node>();

    function recurse(node: Node) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);

        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex >= sequence.length) {
            return;
        }

        const term = sequence[node.termIndex];
        if (term.type === 'non-terminal') {
            let children = dag.getChildren(node);
            if (!children) {
                children = grammar[term.name].map((sequence, index): Node => {
                    return dag.addOrFind({
                        nonTerminal: term.name,
                        sequenceIndex: index,
                        startIndex: node.endIndex,
                        endIndex: node.endIndex,
                        termIndex: 0
                    });
                });
                for (const child of children) {
                    dag.setChild(node, child);
                }
            }
            for (const child of children) {
                recurse(child);
            }
        }
    }

    const roots = dag.getRootNodes();
    for (const root of roots) {
        recurse(root);
    }
}

function accept(token: string) {
    const seen = new Set<Node>();

    function recurse(node: Node) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);

        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex >= sequence.length) {
            return;
        }

        const term = sequence[node.termIndex];
        if (term.type === 'terminal') {
            if (term.terminal === token) {
                node.termIndex += 1;
                node.endIndex += 1;
            }
        } else {
            const children = dag.getChildren(node)!;
            for (const child of children) {
                recurse(child);
            }
        }
    }

    const roots = dag.getRootNodes();
    for (const root of roots) {
        recurse(root);
    }
}

function bubble() {
    const seen = new Set<Node>();

    function recurse(node: Node) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);


    }

    const roots = dag.getRootNodes();
    for (const root of roots) {
        recurse(root);
    }
}

function step(token: string) {
    expand();
    accept(token);
    bubble();
}

console.log('--- initial DAG ---');
console.log(Dot.toDot(grammar, dag));

step('a');
console.log('--- next DAG ---');
console.log(Dot.toDot(grammar, dag));

step('+');
console.log('--- next DAG ---');
console.log(Dot.toDot(grammar, dag));

step('a');
console.log('--- next DAG ---');
console.log(Dot.toDot(grammar, dag));

step('+');
console.log('--- next DAG ---');
console.log(Dot.toDot(grammar, dag));

step('a');
console.log('--- next DAG ---');
console.log(Dot.toDot(grammar, dag));
