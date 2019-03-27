import { Deterministic } from '../finite-state-machine/deterministic';
import { Dot } from '../finite-state-machine/dot';
import { FiniteStateMachine } from '../finite-state-machine/finite-state-machine';
import { Minimizer } from '../finite-state-machine/minimizer';
import { Numberfier } from '../finite-state-machine/numberfier';
import { PushDownAutomaton } from './pushdown-automaton';

class Action<T, U> {
    public readonly input: T;
    public readonly stackIn: U | null;
    public readonly stackOut: U[];

    constructor(input: T, stackIn: U | null, stackOut: U[]) {
        this.input = input;
        this.stackIn = stackIn;
        this.stackOut = stackOut;
    }

    public accept(input: T, stack: U[]): U[] | null {
        if (input === this.input && (stack.length >= 1 && stack[stack.length - 1] === this.stackIn || stack.length === 0 && this.stackIn === null)) {
            return this.stackOut;
        } else {
            return null;
        }
    }
}

function arrayEquals(array1: unknown[], array2: unknown[]) {
    if (array1 === array2) {
        return true;
    }
    if (array1.length !== array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
}

function convertToFiniteStateMachine<S, T, U>(pda: PushDownAutomaton<S, T, U>): FiniteStateMachine<S, Action<T, U>> {
    const actionMap: Map<T, Map<U | null, Map<U[], Action<T, U>>>> = new Map();
    for (const transition of pda.transitions) {
        if (!actionMap.has(transition[1])) {
            actionMap.set(transition[1], new Map());
        }
        if (!actionMap.get(transition[1])!.has(transition[2])) {
            actionMap.get(transition[1])!.set(transition[2], new Map());
        }
        const entries = [...actionMap.get(transition[1])!.get(transition[2])!.entries()];
        const matchedEntry = entries.find(([stackOut]) => arrayEquals(stackOut, transition[3]));
        if (matchedEntry === undefined) {
            actionMap.get(transition[1])!.get(transition[2])!.set(transition[3], new Action(transition[1], transition[2], transition[3]));
        } else {
            actionMap.get(transition[1])!.get(transition[2])!.set(transition[3], matchedEntry[1]);
        }
    }
    const actions: [S, Action<T, U>, S][] = pda.transitions.map<[S, Action<T, U>, S]>(
        (transition) => [transition[0], actionMap.get(transition[1])!.get(transition[2])!.get(transition[3])!, transition[4]]
    );
    return {
        acceptingStates: pda.acceptingStates,
        initialState: pda.initialState,
        transitions: actions
    };
}

const pda: PushDownAutomaton<number, string, string> = {
    acceptingStates: [1],
    initialState: 0,
    transitions: [
        [0, 'a', null, ['A'], 0],
        [0, 'a', 'A', ['A', 'A'], 0],
        [0, 'b', 'A', [], 1],
        [1, 'b', 'A', [], 1]
    ]
};

interface Rule<T> {
    type: 'rule';
    name: string;
    step: StepBuilder<T>;
}

interface Reference {
    type: 'reference';
    name: string;
}

interface Terminal<T> {
    type: 'terminal';
    input: T;
}

interface Sequence<T> {
    type: 'sequence';
    steps: StepBuilder<T>[];
}

interface Alternatives<T> {
    type: 'alternatives';
    steps: StepBuilder<T>[];
}

type BuildStep<T> = Terminal<T> | Rule<T> | Sequence<T> | Alternatives<T> | Reference;

// tslit:disable-next-line:max-classes-per-file
class StepBuilder<T> {
    public static terminal<T>(input: T) {
        return new StepBuilder({ type: 'terminal', input });
    }

    public static reference(name: string) {
        return new StepBuilder<never>({ type: 'reference', name });
    }

    public static sequence<T>(steps: StepBuilder<T>[]) {
        return new StepBuilder({ type: 'sequence', steps });
    }

    public static alternatives<T>(steps: StepBuilder<T>[]) {
        return new StepBuilder({ type: 'alternatives', steps });
    }

    private step: BuildStep<T>;

    constructor(step: BuildStep<T>) {
        this.step = step;
    }
}

class Builder<T> {

}

StepBuilder
    .rule('S', StepBuilder.sequence([
        StepBuilder.terminal('a'),
        StepBuilder.reference('C'),
        StepBuilder.terminal('b')
    ]))
    .rule('C', StepBuilder.terminal('c'));

const fsm = Numberfier.convertStateToNumbers(Minimizer.removeDeadlocks(Minimizer.minimize(Deterministic.deterministic(convertToFiniteStateMachine(pda)))));

const dot = new Dot(
    (state: number) => `S${state}`,
    (action: Action<string, string>) => `${action.input};${action.stackIn === null ? 'ε' : action.stackIn}/${action.stackOut.length >= 1 ? action.stackOut.join(',') : 'ε'}`
).toDot(fsm);

console.log(dot);
