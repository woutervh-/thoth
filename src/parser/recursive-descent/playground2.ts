import * as Nodes from './node';
import { RuleBuilder } from './rule-builder';
import * as Steps from './step';
import { StepBuilder } from './step-builder';

function parseTerminal<T>(input: T[], position: number, step: Steps.Terminal<T>): Nodes.Node<T> | null {
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

function parseSequence<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Sequence<T>): Nodes.Node<T> | null {
    const children: Nodes.Node<T>[] = [];
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

function parseAlternatives<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Alternatives<T>): Nodes.Node<T> | null {
    for (const alternativeStep of step.steps) {
        const result = parseStep(input, position, rules, alternativeStep);
        if (result !== null) {
            return result;
        }
    }
    return null;
}

function parseReference<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, name: string): Nodes.Node<T> | null {
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

function parseRepeat<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Repeat<T>): Nodes.Node<T> | null {
    const children: Nodes.Node<T>[] = [];
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

function parseStep<T>(input: T[], position: number, rules: Map<string, Steps.Step<T>>, step: Steps.Step<T>): Nodes.Node<T> | null {
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

function postProcess<T>(node: Nodes.Node<T>): Nodes.SequenceNode<T> | Nodes.RuleNode<T> {
    switch (node.type) {
        case 'empty':
        case 'terminal':
            return { type: 'sequence', span: node.span, children: [node] };
        case 'rule':
        case 'sequence': {
            const children = node.children.map(postProcess);
            const newChildren: Nodes.Node<T>[] = [];
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

function parse<T>(input: T[], rules: Map<string, Steps.Step<T>>, initialRule: string) {
    const node = parseReference(input, 0, rules, initialRule);
    if (node !== null) {
        return postProcess(node);
    } else {
        return node;
    }
}

const integer = StepBuilder.repeat(StepBuilder.alternatives(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => StepBuilder.terminal(digit))), 1);
const operator = StepBuilder.alternatives(['+', '-', '*', '/'].map((operator) => StepBuilder.terminal(operator)));
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

const input = '123+456+789;4-(3-2-1);';

const result = parse(input.split(''), rules, 'S');
console.log(JSON.stringify(result));
