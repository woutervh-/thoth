import { Builder as FiniteStateMachineBuiler } from "../finite-state-machine/builder";
import { Deterministic } from "../finite-state-machine/deterministic";
import { Dot } from "../finite-state-machine/dot";
import { FiniteStateMachine } from "../finite-state-machine/finite-state-machine";
import { Minimizer } from "../finite-state-machine/minimizer";
import { Numberfier } from "../finite-state-machine/numberfier";
import { PushDownAutomaton } from "./pushdown-automaton";

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
        [0, "a", null, ["A"], 0],
        [0, "a", "A", ["A", "A"], 0],
        [0, "b", "A", [], 1],
        [1, "b", "A", [], 1]
    ]
};

interface Rule<T> {
    type: "rule";
    name: string;
    step: BuildStep<T>;
}

interface Reference {
    type: "reference";
    name: string;
}

interface Terminal<T> {
    type: "terminal";
    input: T;
}

interface Sequence<T> {
    type: "sequence";
    steps: BuildStep<T>[];
}

interface Alternatives<T> {
    type: "alternatives";
    steps: BuildStep<T>[];
}

type BuildStep<T> = Terminal<T> | Rule<T> | Sequence<T> | Alternatives<T> | Reference;

// tslint:disable-next-line:max-classes-per-file
class StepBuilder {
    public static terminal<T>(input: T): Terminal<T> {
        return { type: "terminal", input };
    }

    public static reference(name: string): Reference {
        return { type: "reference", name };
    }

    public static sequence<T>(steps: BuildStep<T>[]): Sequence<T> {
        return { type: "sequence", steps };
    }

    public static alternatives<T>(steps: BuildStep<T>[]): Alternatives<T> {
        return { type: "alternatives", steps };
    }
}

// tslint:disable-next-line:max-classes-per-file
class Builder<T> {
    private rules: Map<string, BuildStep<T>> = new Map();

    public rule(name: string, step: BuildStep<T>) {
        this.rules.set(name, step);
        return this;
    }

    public build(startingRule: string) {
        const buildStep = this.rules.get(startingRule);
        if (buildStep === undefined) {
            throw new Error(`Rule ${startingRule} is not defined.`);
        }
        if (buildStep.type === "alternatives") {
            FiniteStateMachineBuiler.alternatives()
        }
    }
}

// TODO: PDA or Recursive Descent??
// https://www.tutorialspoint.com/automata_theory/pda_context_free_grammar.htm
// https://en.wikipedia.org/wiki/Chomsky_normal_form
// https://en.wikipedia.org/wiki/Greibach_normal_form

new Builder<string>()
    .rule("S", StepBuilder.sequence([
        StepBuilder.terminal("a"),
        StepBuilder.reference("C"),
        StepBuilder.terminal("b")
    ]))
    .rule("C", StepBuilder.terminal("c"));

const fsm = Numberfier.convertStateToNumbers(Minimizer.removeDeadlocks(Minimizer.minimize(Deterministic.deterministic(convertToFiniteStateMachine(pda)))));

const dot = new Dot(
    (state: number) => `S${state}`,
    (action: Action<string, string>) => `${action.input};${action.stackIn === null ? "ε" : action.stackIn}/${action.stackOut.length >= 1 ? action.stackOut.join(",") : "ε"}`
).toDot(fsm);

console.log(dot);
