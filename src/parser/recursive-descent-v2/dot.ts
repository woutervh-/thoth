import { DAG } from "./dag";
import { Node } from "./node";
import { Printer } from "../../grammar/printer";
import { Grammar } from "../../grammar/grammar";

export class Dot {
    public static toDot<T>(grammar: Grammar<T>, dag: DAG) {
        const dotHeader: string[] = [
            "digraph G {",
            "ratio = fill;",
            "node [style=filled];"
        ];

        const dotFooter: string[] = [
            "}"
        ];

        const nameMap: Map<Node, string> = new Map();
        {
            const seen = new Set<Node>();
            const queue = dag.getRootNodes();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (seen.has(node)) {
                    continue;
                }
                seen.add(node);
                const children = dag.getChildren(node);
                if (children) {
                    for (const child of children) {
                        if (!nameMap.has(child)) {
                            queue.push(child);
                        }
                    }
                }
                nameMap.set(node, `t${nameMap.size}`);
            }
        }

        const nodes: string[] = [];
        const edges: string[] = [];
        {
            const seen = new Set<Node>();
            const queue = dag.getRootNodes();
            while (queue.length >= 1) {
                const node = queue.pop()!;
                if (seen.has(node)) {
                    continue;
                }
                seen.add(node);
                const children = dag.getChildren(node);
                if (children) {
                    for (const child of children) {
                        edges.push(`${nameMap.get(node)!} -> ${nameMap.get(child)!};`);
                        queue.push(child);
                    }
                }
                const label = Printer.stringifySequence(grammar[node.nonTerminal][node.sequenceIndex], node.termIndex);
                let color: string;
                if (node.termIndex >= grammar[node.nonTerminal][node.sequenceIndex].length) {
                    color = "grey";
                } else {
                    color = "white";
                }
                // nodes.push(`${nameMap.get(node)!} [fillcolor="${color}", label="${node.startIndex}-${node.endIndex} ${node.nonTerminal} &rarr; ${label}"];`);
                nodes.push(`${nameMap.get(node)!} [fillcolor="${color}", label="${node.startIndex} ${node.nonTerminal} &rarr; ${label}"];`);
            }
        }

        const lines = [
            ...dotHeader,
            ...edges,
            ...nodes,
            ...dotFooter
        ];

        return lines.join("\n").replace(/•/g, "&bull;");
    }
}
