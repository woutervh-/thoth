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

function stepTerminals(nodes: RuleNode[], token: string): RuleNode[] {
    const seen = new Set<RuleNode>();
    const rejected = new Set<RuleNode>();

    function recurse(node: RuleNode) {
        if (seen.has(node)) {
            return;
        }
        seen.add(node);

        const sequence = grammar[node.nonTerminal][node.sequenceIndex];
        if (node.termIndex >= sequence.length) {
            // Sequence has run out of symbols and cannot accept any more tokens.
            rejected.add(node);
            return;
        }

        const term = sequence[node.termIndex];
        if (term.type === 'terminal') {
            if (term.terminal !== token) {
                rejected.add(node);
                return null;
            }
            node.termIndex += 1;
            node.tokenIndex += 1;
        } else {
            for (const child of node.childNodes!) {
                recurse(child);
            }
            node.childNodes = node.childNodes!.filter((child) => !rejected.has(child));
            if (node.childNodes.length <= 0) {
                rejected.add(node);
            }
        }
    }

    for (const node of nodes) {
        recurse(node);
    }

    return nodes.filter((node) => !rejected.has(node));
}

function stepNonTerminals(node: RuleNode[]): RuleNode[] {
    const sequence = grammar[node.nonTerminal][node.sequenceIndex];

    if (node.termIndex >= sequence.length) {
        // Sequence has run out of symbols and cannot accept any more tokens.
        return node;
    }

    const term = sequence[node.termIndex];
    if (term.type === 'terminal') {
        return node;
    }

    let childNodes: RuleNode[];
    if (node.childNodes === null) {
        childNodes = grammar[term.name].map<RuleNode>((sequence, index) => {
            return {
                nonTerminal: term.name,
                sequenceIndex: index,
                termIndex: 0,
                tokenIndex: node.tokenIndex,
                childNodes: null
            };
        });
    } else {
        childNodes = node.childNodes;
    }

    childNodes = childNodes.map(stepNonTerminals);
    return {
        ...node,
        childNodes
    };
}

function step(node: RuleNode, token: string): RuleNode | null {
    let nextNode: RuleNode | null = node;
    nextNode = stepNonTerminals(nextNode);
    nextNode = stepTerminals(nextNode, token);
    return nextNode;
}

function areRuleNodesEqual(ruleNodeA: RuleNode, ruleNodeB: RuleNode) {
    return ruleNodeA.nonTerminal === ruleNodeB.nonTerminal
        && ruleNodeA.sequenceIndex === ruleNodeB.sequenceIndex
        && ruleNodeA.termIndex === ruleNodeB.termIndex
        && ruleNodeA.tokenIndex === ruleNodeB.tokenIndex;
}

function deduplicate(nodes: RuleNode[]): RuleNode[] {
    const nodeList: RuleNode[] = [];

    function dedupe(node: RuleNode): RuleNode {
        const found = nodeList.find((nodeB) => areRuleNodesEqual(node, nodeB));
        if (found) {
            return found;
        }
        if (node.childNodes === null) {
            return node;
        }
        node = {
            ...node,
            childNodes: node.childNodes.map(dedupe)
        };
        nodeList.push(node);
        return node;
    }

    return nodes.map(dedupe);
}

function stepNodes(nodes: RuleNode[], token: string): RuleNode[] {
    let nextNodes = nodes
        .map((node) => step(node, token))
        .filter(isNonNullable);
    nextNodes = deduplicate(nextNodes);
    return nextNodes;
}

let currentRootNodes = initialRootNodes;

console.log('--- first rule tree ---');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- second rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- third rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, '*');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- fourth rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- fifth rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, '-');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- sixth rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- seventh rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, '*');
console.log(Dot.toDot(grammar, currentRootNodes));

console.log('--- eigth rule tree ---');
currentRootNodes = stepNodes(currentRootNodes, 'a');
console.log(Dot.toDot(grammar, currentRootNodes));
