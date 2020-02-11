import { RuleNode } from './rule-node';
import { Printer } from '../../grammar/printer';
import { Grammar } from '../../grammar/grammar';

export class Dot {
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
            const queue = rootNodes.slice();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (node.childNodes) {
                    queue.push(...node.childNodes);
                }
                nameMap.set(node, `t${nameMap.size}`);
            }
        }

        const nodes: string[] = [];
        const transitions: string[] = [];
        {
            const queue = rootNodes.slice();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (node.childNodes) {
                    for (const child of node.childNodes) {
                        transitions.push(`${nameMap.get(node)!} -> ${nameMap.get(child)!};`);
                        queue.push(child);
                    }
                }
                const label = Printer.stringifySequence(grammar[node.nonTerminal][node.sequenceIndex], node.termIndex);
                nodes.push(`${nameMap.get(node)!} [label="${label}"];`);
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
