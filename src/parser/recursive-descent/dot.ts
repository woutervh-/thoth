import * as DAG from './dag';
import { RuleNode } from './rule-node';
import { Printer } from '../../grammar/printer';
import { Grammar } from '../../grammar/grammar';

export class Dot {
    public static dagToDot<T>(grammar: Grammar<T>, dag: DAG.DAG) {
        const nodeMap: Map<DAG.Node, RuleNode> = new Map();
        
        function recurse(node: DAG.Node): RuleNode {
            if (nodeMap.has(node)) {
                return nodeMap.get(node)!;
            }
            const ruleNode: RuleNode = {
                ...node,
                children: dag.getChildren(node).map(recurse)
            };
            nodeMap.set(node, ruleNode);
            return ruleNode;
        }

        for (const node of dag.nodes) {
            recurse(node);
        }

        const nodes = [...nodeMap.values()];
        return Dot.toDot(grammar, nodes);
    }

    public static toDot<T>(grammar: Grammar<T>, rootNodes: RuleNode[]) {
        const dotHeader: string[] = [
            'digraph G {',
            'ratio = fill;',
            'node [style=filled];'
        ];

        const dotFooter: string[] = [
            '}'
        ];

        const nameMap: Map<RuleNode, string> = new Map();
        {
            const seen = new Set<RuleNode>();
            const queue = rootNodes.slice();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (seen.has(node)) {
                    continue;
                }
                seen.add(node);
                if (node.children) {
                    for (const child of node.children) {
                        if (!nameMap.has(child)) {
                            queue.push(child);
                        }
                    }
                }
                nameMap.set(node, `t${nameMap.size}`);
            }
        }

        const nodes: string[] = [];
        const transitions: string[] = [];
        {
            const seen = new Set<RuleNode>();
            const queue = rootNodes.slice();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (seen.has(node)) {
                    continue;
                }
                seen.add(node);
                if (node.children) {
                    for (const child of node.children) {
                        transitions.push(`${nameMap.get(node)!} -> ${nameMap.get(child)!};`);
                        queue.push(child);
                    }
                }
                const label = Printer.stringifySequence(grammar[node.nonTerminal][node.sequenceIndex], node.termIndex);
                let color: string;
                if (node.termIndex >= grammar[node.nonTerminal][node.sequenceIndex].length) {
                    color = 'darkgrey';
                } else {
                    color = 'white';
                }
                nodes.push(`${nameMap.get(node)!} [fillcolor="${color}", label="(${node.tokenIndex}; ${node.nonTerminal} &rarr; ${label})"];`);
            }
        }

        const lines = [
            ...dotHeader,
            ...transitions,
            ...nodes,
            ...dotFooter
        ];

        return lines.join('\n').replace(/•/g, '&bull;');
    }
}
