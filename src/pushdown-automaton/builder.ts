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

type InternalBuilder<T> = EmptyBuilder | TerminalBuilder<T> | SuccessionBuilder<T>;

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

    private static buildSuccessionInternal<T>(internal: SuccessionBuilder<T>): BuildStep<T> {
        const first = Builder.buildInternal(internal.first.internal);
        const second = Builder.buildInternal(internal.second.internal);
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

    private static buildInternal<T>(internal: InternalBuilder<T>): BuildStep<T> {
        switch (internal.type) {
            case 'empty':
                return Builder.buildEmptyInternal();
            case 'terminal':
                return Builder.buildTerminalInternal(internal);
            case 'succession':
                return Builder.buildSuccessionInternal(internal);
        }
    }

    private internal: InternalBuilder<T>;

    private constructor(internal: InternalBuilder<T>) {
        this.internal = internal;
    }

    public build(): PushDownAutomaton<number, T, number> {
        const buildStep = Builder.buildInternal(this.internal);
        return {
            acceptingStates: buildStep.acceptingStates,
            initialState: buildStep.initialState,
            transitions: buildStep.transitions
        };
    }
}
