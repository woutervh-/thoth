import { Grammar } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';
import { RuleNode } from './rule-node';
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

// grammar = Deterministic.leftFactor(grammar);
// console.log('--- left-factored ---');
// Printer.printGrammar(grammar);

grammar = Minimizer.removeEmptyRules(grammar);
console.log('--- remove empty non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.substituteSimpleNonTerminals(grammar);
console.log('--- substitute simple non-terminals ---');
Printer.printGrammar(grammar);

// grammar = Minimizer.removeUnreachables(grammar, ['E']);
grammar = Minimizer.removeUnreachables(grammar, [startSymbol]);
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);

function stepTerminals(nodes: RuleNode[], token: string): RuleNode[] {
    const seen = new Set<RuleNode>();
    const accepting = new Set<RuleNode>();
    const rejecting = new Set<RuleNode>();

    function recurse(node: RuleNode) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);

        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex >= sequence.length) {
            // Sequence has run out of symbols and cannot accept any more tokens.
            accepting.add(node);
            rejecting.add(node);
            return;
        }

        const term = sequence[node.termIndex];
        if (term.type === 'terminal') {
            if (term.terminal !== token) {
                rejecting.add(node);
                return null;
            }
            node.termIndex += 1;
            node.tokenIndex += 1;
        } else {
            for (const child of node.childNodes!) {
                recurse(child);
            }
            node.childNodes = node.childNodes!.filter((child) => !rejecting.has(child));
            if (node.childNodes.length <= 0) {
                rejecting.add(node);
            }
        }
    }

    for (const node of nodes) {
        recurse(node);
    }

    return nodes.filter((node) => !rejecting.has(node));
}

function stepNonTerminals(nodes: RuleNode[]) {
    const seen = new Set<RuleNode>();

    function recurse(node: RuleNode) {
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
            return;
        }

        if (node.childNodes === null) {
            node.childNodes = grammar[term.name].map<RuleNode>((sequence, index) => {
                return {
                    nonTerminal: term.name,
                    sequenceIndex: index,
                    termIndex: 0,
                    tokenIndex: node.tokenIndex,
                    childNodes: null
                };
            });
        }

        for (const child of node.childNodes) {
            recurse(child);
        }
    }

    for (const node of nodes) {
        recurse(node);
    }
}

function areRuleNodesEqual(ruleNodeA: RuleNode, ruleNodeB: RuleNode) {
    return ruleNodeA.nonTerminal === ruleNodeB.nonTerminal
        && ruleNodeA.sequenceIndex === ruleNodeB.sequenceIndex
        && ruleNodeA.termIndex === ruleNodeB.termIndex
        && ruleNodeA.tokenIndex === ruleNodeB.tokenIndex;
}

function deduplicate(nodes: RuleNode[]): RuleNode[] {
    const nodeList: RuleNode[] = [];

    function recurse(node: RuleNode): RuleNode {
        const found = nodeList.find((nodeB) => areRuleNodesEqual(node, nodeB));
        if (found) {
            return found;
        }
        nodeList.push(node);
        if (node.childNodes === null) {
            return node;
        }
        node.childNodes = node.childNodes.map(recurse);
        return node;
    }

    return nodes.map(recurse);
}

function stepNodes(nodes: RuleNode[], token: string): RuleNode[] {
    stepNonTerminals(nodes);
    nodes = stepTerminals(nodes, token);
    nodes = deduplicate(nodes);
    return nodes;
}

const initialRootNodes = grammar[startSymbol].map((sequence, index): RuleNode => {
    return {
        nonTerminal: startSymbol,
        sequenceIndex: index,
        termIndex: 0,
        tokenIndex: 0,
        childNodes: null
    };
});
let currentRootNodes = initialRootNodes;

console.log('--- initial forest ---');
console.log(Dot.toDot(grammar, currentRootNodes));

const tokens = 'a*a-a*a;'.split('');
for (const token of tokens) {
    currentRootNodes = stepNodes(currentRootNodes, token);
    console.log('--- next rule forest ---');
    console.log(Dot.toDot(grammar, currentRootNodes));
}
