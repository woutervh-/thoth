// tslint:disable:max-classes-per-file

import { PushDownAutomaton } from './pushdown-automaton';

interface EmptyBuilder {
    type: 'empty';
}

interface TerminalBuilder<T> {
    type: 'terminal';
    action: T;
}

interface SuccessionBuilder<T> {
    type: 'succession';
    first: Builder<T>;
    second: Builder<T>;
}

interface NamedBuilder<T> {
    type: 'named';
    name: string;
    builder: Builder<T>;
}

interface ReferenceBuilder {
    type: 'reference';
    name: string;
}

type InternalBuilder<T> =
    EmptyBuilder
    | TerminalBuilder<T>
    | SuccessionBuilder<T>
    | NamedBuilder<T>
    | ReferenceBuilder;

interface BuildStep<T> {
    acceptingStates: number[];
    initialState: number;
    stackCounter: number;
    stateCounter: number;
    transitions: [number, T, number | null, number[], number][];
}

export class Builder<T> {
    public static empty<T>() {
        return new Builder<T>({ type: 'empty' });
    }

    public static terminal<T>(action: T) {
        return new Builder<T>({ type: 'terminal', action });
    }

    public static succession<T>(first: Builder<T>, second: Builder<T>) {
        return new Builder<T>({ type: 'succession', first, second });
    }

    public static named<T>(name: string, builder: Builder<T>) {
        return new Builder<T>({ type: 'named', name, builder });
    }

    public static reference<T>(name: string) {
        return new Builder<T>({ type: 'reference', name });
    }

    private static buildEmptyInternal<T>(): BuildStep<T> {
        return {
            acceptingStates: [0],
            initialState: 0,
            stackCounter: 0,
            stateCounter: 1,
            transitions: []
        };
    }

    private static buildTerminalInternal<T>(internal: TerminalBuilder<T>): BuildStep<T> {
        return {
            acceptingStates: [1],
            initialState: 0,
            stackCounter: 0,
            stateCounter: 2,
            transitions: [[0, internal.action, null, [], 1]]
        };
    }

    private static buildSuccessionInternal<T>(internal: SuccessionBuilder<T>, names: Map<string, InternalBuilder<T>>): BuildStep<T> {
        const first = Builder.buildInternal(internal.first.internal, names);
        const second = Builder.buildInternal(internal.second.internal, names);
        const stackCounter = first.stackCounter + second.stackCounter;
        const stateCounter = first.stateCounter + second.stateCounter;
        const initialState = first.initialState;
        const acceptingStates = second.acceptingStates.map((state) => state + first.stateCounter);
        if (second.acceptingStates.includes(second.initialState)) {
            acceptingStates.push(...first.acceptingStates);
        }
        const transitions: [number, T, number | null, number[], number][] = [];
        transitions.push(
            ...first.transitions
        );
        transitions.push(
            ...second.transitions
                .map<[number, T, number | null, number[], number]>(
                    (transition) => [
                        transition[0] + first.stateCounter,
                        transition[1],
                        transition[2] === null ? null : transition[2] + first.stackCounter,
                        transition[3].map((symbol) => symbol + first.stackCounter),
                        transition[4] + first.stateCounter
                    ]
                )
        );
        for (const acceptingState of first.acceptingStates) {
            transitions.push(
                ...second.transitions
                    .filter((transition) => transition[0] === second.initialState)
                    .map<[number, T, number | null, number[], number]>(
                        (transition) => [
                            acceptingState,
                            transition[1],
                            transition[2] === null ? null : transition[2] + first.stackCounter,
                            transition[3].map((symbol) => symbol + first.stackCounter),
                            transition[4] + first.stateCounter
                        ]
                    )
            );
        }
        return {
            acceptingStates,
            initialState,
            stackCounter,
            stateCounter,
            transitions
        };
    }

    private static buildInternalNamed<T>(internal: NamedBuilder<T>, names: Map<string, InternalBuilder<T>>): BuildStep<T> {
        if (names.has(internal.name)) {
            throw new Error(`Name ${internal.name} defined more than once.`);
        }
        names.set(internal.name, internal.builder.internal);
        return Builder.buildInternal(internal.builder.internal, names);
    }

    private static buildInternalReference<T>(internal: ReferenceBuilder, names: Map<string, InternalBuilder<T>>): BuildStep<T> {
        if (!names.has(internal.name)) {
            throw new Error(`Name ${internal.name} is not defined.`);
        }
        const builderInternal = names.get(internal.name)!;
        switch (builderInternal.type) {
            case 'empty':
                return Builder.buildEmptyInternal();
            case 'terminal':
                return Builder.buildTerminalInternal(builderInternal);
        }
    }

    private static buildInternal<T>(internal: InternalBuilder<T>, names: Map<string, InternalBuilder<T>>): BuildStep<T> {
        switch (internal.type) {
            case 'empty':
                return Builder.buildEmptyInternal();
            case 'terminal':
                return Builder.buildTerminalInternal(internal);
            case 'succession':
                return Builder.buildSuccessionInternal(internal, names);
            case 'named':
                return Builder.buildInternalNamed(internal, names);
            case 'reference':
                return Builder.buildInternalReference(internal, names);
        }
    }

    private internal: InternalBuilder<T>;

    private constructor(internal: InternalBuilder<T>) {
        this.internal = internal;
    }

    public build(): PushDownAutomaton<number, T, number> {
        const buildStep = Builder.buildInternal(this.internal, new Map());
        return {
            acceptingStates: buildStep.acceptingStates,
            initialState: buildStep.initialState,
            transitions: buildStep.transitions
        };
    }
}
