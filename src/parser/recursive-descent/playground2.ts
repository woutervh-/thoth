import * as Nodes from './node';
import { RuleBuilder } from './rule-builder';
import * as Steps from './step';
import { StepBuilder } from './step-builder';

function parseTerminal<T>(input: T[], position: number, step: Steps.Terminal<T>): Nodes.PreNode<T> | null {
    if (input[position] === step.input) {
        return {
            span: { start: position, end: position + 1 },
            terminal: input[position],
            type: 'terminal'
        };
    } else {
        return null;
    }
}

function parseSequence<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Sequence<T>): Nodes.PreNode<T> | null {
    const children: Nodes.PreNode<T>[] = [];
    let currentPosition = position;
    for (const sequenceStep of step.steps) {
        const result = parseStep(input, currentPosition, rules, sequenceStep);
        if (result === null) {
            return null;
        }
        children.push(result);
        currentPosition = result.span.end;
    }
    return {
        children,
        span: { start: position, end: currentPosition },
        type: 'sequence'
    };
}

function parseAlternatives<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Alternatives<T>): Nodes.PreNode<T> | null {
    for (const alternativeStep of step.steps) {
        const result = parseStep(input, position, rules, alternativeStep);
        if (result !== null) {
            return result;
        }
    }
    return null;
}

function parseReference<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, name: string): Nodes.PreNode<T> | null {
    const step = rules.get(name);
    if (step === undefined) {
        throw new Error('Rule is not defined.');
    }
    const child = parseStep(input, position, rules, step);
    if (child === null) {
        return null;
    }
    return {
        children: [child],
        name,
        span: child.span,
        type: 'rule'
    };
}

function parseRepeat<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Repeat<T>): Nodes.PreNode<T> | null {
    const children: Nodes.PreNode<T>[] = [];
    let currentStep = 0;
    let currentPosition = position;
    while (currentStep < step.max) {
        const result = parseStep(input, currentPosition, rules, step.step);
        if (result === null) {
            break;
        }
        children.push(result);
        currentPosition = result.span.end;
        currentStep += 1;
    }
    if (currentStep < step.min) {
        return null;
    }
    return {
        children,
        span: { start: position, end: currentPosition },
        type: 'sequence'
    };
}

function parseEmpty(position: number): Nodes.Empty | null {
    return { type: 'empty', span: { start: position, end: position } };
}

function parseStep<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Step<T>): Nodes.PreNode<T> | null {
    switch (step.type) {
        case 'terminal':
            return parseTerminal(input, position, step);
        case 'sequence':
            return parseSequence(input, position, rules, step);
        case 'alternatives':
            return parseAlternatives(input, position, rules, step);
        case 'reference':
            return parseReference(input, position, rules, step.name);
        case 'repeat':
            return parseRepeat(input, position, rules, step);
        case 'empty':
            return parseEmpty(position);
    }
}

function postProcess1<T>(node: Nodes.PreNode<T>): Nodes.PreNode<T> {
    switch (node.type) {
        case 'empty':
        case 'terminal':
            return node;
        case 'rule':
        case 'sequence': {
            const children = node.children.map(postProcess1);
            const newChildren: Nodes.PreNode<T>[] = [];
            for (const child of children) {
                if (child.type === 'sequence') {
                    newChildren.push(...child.children);
                } else {
                    newChildren.push(child);
                }
            }
            return { ...node, children: newChildren };
        }
    }
}

function postProcess2<T>(node: Nodes.PreNode<T>): Nodes.PreNode<T> {
    if (node.type === 'rule') {
        const children = node.children.map(postProcess2);
        const newChildren: Nodes.PreNode<T>[] = [];
        for (const child of children) {
            if (child.type === 'rule' && node.name === child.name) {
                newChildren.push(...child.children);
            } else {
                newChildren.push(child);
            }
        }
        return { ...node, children: newChildren };
    } else {
        return node;
    }
}

function parse<T>(input: T[], rules: Map<string, Steps.Step<T>>, initialRule: string) {
    return parseReference(input, 0, rules, initialRule);
}

function makeNameMap<T>(node: Nodes.PreNode<T>) {
    const nameMap: Map<Nodes.PreNode<T>, string> = new Map();
    const queue = [node];
    while (queue.length >= 1) {
        const node = queue.pop()!;
        if (node.type === 'rule' || node.type === 'sequence') {
            queue.push(...node.children);
        }
        nameMap.set(node, `t${nameMap.size}`);
    }
    return nameMap;
}

function toDot<T>(node: Nodes.PreNode<T>, terminalToLabel: (terminal: T) => string) {
    const dotHeader: string[] = [
        'digraph G {',
        'ratio = fill;',
        'node [style=filled];'
    ];

    const dotFooter: string[] = [
        '}'
    ];

    const nameMap = makeNameMap(node);
    const nodes: string[] = [];
    const transitions: string[] = [];
    const queue = [node];
    while (queue.length >= 1) {
        const node = queue.pop()!;
        if (node.type === 'rule' || node.type === 'sequence') {
            for (const child of node.children) {
                transitions.push(`${nameMap.get(node)!} -> ${nameMap.get(child)!};`);
                queue.push(child);
            }
        }
        let label: string;
        if (node.type === 'rule') {
            label = node.name;
        } else if (node.type === 'terminal') {
            label = terminalToLabel(node.terminal);
        } else if (node.type === 'empty') {
            label = 'ε';
        } else {
            label = '';
        }
        nodes.push(`${nameMap.get(node)!} [label="${label}"];`);
    }

    const lines = [
        ...dotHeader,
        ...transitions,
        ...nodes,
        ...dotFooter
    ];
    return lines.join('\n');
}

const integer = StepBuilder.repeat(StepBuilder.alternatives('0123456789'.split('').map((digit) => StepBuilder.terminal(digit))), 1);
const operator = StepBuilder.alternatives('+-*/'.split('').map((operator) => StepBuilder.terminal(operator)));
const semicolon = StepBuilder.terminal(';');
const leftParenthesis = StepBuilder.terminal('(');
const rightParenthesis = StepBuilder.terminal(')');
const expression = StepBuilder.alternatives([
    StepBuilder.sequence([integer, StepBuilder.repeat(StepBuilder.sequence([operator, StepBuilder.reference('E')]))]),
    StepBuilder.sequence([leftParenthesis, StepBuilder.reference('E'), rightParenthesis])
]);
const statement = StepBuilder.sequence([StepBuilder.reference('E'), semicolon]);
const statements = StepBuilder.repeat(statement);

const rules = new RuleBuilder<string>()
    .rule('S', statements)
    .rule('E', expression)
    .build();

const input = '123+456+789;4-(3*2-1);';

const result = parse(input.split(''), rules, 'S');
if (result !== null) {
    if ({} === {}) {
        postProcess2(postProcess1(result));
    }
    console.log(toDot(result, (terminal) => terminal));
}

console.log(JSON.stringify(result));
