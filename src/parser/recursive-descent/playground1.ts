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
    return parseStep(input, position, rules, step);
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
        throw new Error('Too little repeats.');
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

function parse<T>(input: T[], rules: Map<string, Steps.Step<T>>, initialRule: string) {
    return parseReference(input, 0, rules, initialRule);
}

const rules = new RuleBuilder<string>()
    .rule('S', StepBuilder.sequence([
        StepBuilder.terminal('a'),
        StepBuilder.alternatives([
            StepBuilder.reference('S'),
            StepBuilder.empty()
        ]),
        StepBuilder.terminal('b')
    ]))
    .build();

const input = 'aaaaabbbbb';

const result = parse(input.split(''), rules, 'S');
console.log(JSON.stringify(result));
