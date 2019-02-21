// tslint:disable:max-classes-per-file

import { PushDownAutomaton } from './pushdown-automaton';

interface InternalBuilder<T> {
    getStateCounter(): number;
    getStackCounter(): number;
    build(): PushDownAutomaton<number, T, number>;
}

class EmptyBuilder<T> implements InternalBuilder<T> {
    public getStackCounter() {
        return 0;
    }

    public getStateCounter() {
        return 1;
    }

    public build(): PushDownAutomaton<number, T, number> {
        return {
            acceptingStates: [0],
            initialState: 0,
            transitions: []
        };
    }
}

class TerminalBuilder<T> implements InternalBuilder<T> {
    private action: T;

    constructor(action: T) {
        this.action = action;
    }

    public getStackCounter() {
        return 0;
    }

    public getStateCounter() {
        return 2;
    }

    public build(): PushDownAutomaton<number, T, number> {
        return {
            acceptingStates: [1],
            initialState: 0,
            transitions: [
                [0, this.action, null, [], 1]
            ]
        };
    }
}

class SuccessionBuilder<T> implements InternalBuilder<T> {
    private first: InternalBuilder<T>;
    private second: InternalBuilder<T>;

    constructor(first: InternalBuilder<T>, second: InternalBuilder<T>) {
        this.first = first;
        this.second = second;
    }

    public getStackCounter() {
        return this.first.getStackCounter() + this.second.getStackCounter();
    }

    public getStateCounter() {
        return this.first.getStateCounter() + this.second.getStateCounter();
    }

    public build(): PushDownAutomaton<number, T, number> {
        const stackOffset = this.first.getStackCounter();
        const stateOffset = this.first.getStateCounter();
        const first = this.first.build();
        const second = this.second.build();
        const initialState = first.initialState;
        const acceptingStates = second.acceptingStates.map((state) => state + stateOffset);
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
                        transition[0] + stateOffset,
                        transition[1],
                        transition[2] === null ? null : transition[2] + stackOffset,
                        transition[3].map((symbol) => symbol + stackOffset),
                        transition[4] + stateOffset
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
                            transition[2] === null ? null : transition[2] + stackOffset,
                            transition[3].map((symbol) => symbol + stackOffset),
                            transition[4] + stateOffset
                        ]
                    )
            );
        }
        return { acceptingStates, initialState, transitions };
    }
}

export class Builder<T> {
    public static empty<T>() {
        return new EmptyBuilder<T>();
    }

    public static terminal<T>(action: T) {
        return new TerminalBuilder(action);
    }

    // public static many<T>(term: Builder<T>) {
    //     const transitionsFromInitialState = term.transitions.filter((transition) => transition[0] === term.initialState);
    //     const transitions: [number, T, number][] = [];
    //     transitions.push(...term.transitions);
    //     for (const acceptingState of term.acceptingStates) {
    //         transitions.push(
    //             ...transitionsFromInitialState.map<[number, T, number]>((transition) =>
    //                 [acceptingState, transition[1], transition[2]]
    //             )
    //         );
    //     }
    //     return new Builder<T>(term.stateCounter, term.acceptingStates, term.initialState, transitions);
    // }

    // public static maybe<T>(term: Builder<T>) {
    //     let stateCounter = term.stateCounter;
    //     const initialState = stateCounter++;
    //     const transitions: [number, T, number][] = [];
    //     transitions.push(...term.transitions);
    //     transitions.push(
    //         ...term.transitions
    //             .filter((transition) => transition[0] === term.initialState)
    //             .map<[number, T, number]>((transition) => [initialState, transition[1], transition[2]])
    //     );
    //     const acceptingStates = [...term.acceptingStates, initialState];
    //     return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    // }

    // public static any<T>(term: Builder<T>) {
    //     return Builder.maybe(Builder.many(term));
    // }

    public static succession<T>(first: InternalBuilder<T>, second: InternalBuilder<T>) {
        return new SuccessionBuilder(first, second);
    }

    // public static sequence<T>(terms: Builder<T>[]) {
    //     return terms.reduce((first, second) => Builder.succession(first, second));
    // }

    // public static either<T>(first: Builder<T>, second: Builder<T>) {
    //     const stateCounter = first.stateCounter + second.stateCounter + 1;
    //     const initialState = first.stateCounter + second.stateCounter;
    //     const acceptingStates: number[] = [];
    //     acceptingStates.push(
    //         ...first.acceptingStates
    //     );
    //     acceptingStates.push(
    //         ...second.acceptingStates
    //             .map((state) => state + first.stateCounter)
    //     );
    //     if (first.acceptingStates.includes(first.initialState) || second.acceptingStates.includes(second.initialState)) {
    //         acceptingStates.push(initialState);
    //     }
    //     const transitions: [number, T, number][] = [];
    //     transitions.push(
    //         ...first.transitions
    //     );
    //     transitions.push(
    //         ...second.transitions
    //             .map<[number, T, number]>(
    //                 (transition) => [transition[0] + first.stateCounter, transition[1], transition[2] + first.stateCounter]
    //             )
    //     );
    //     transitions.push(
    //         ...first.transitions
    //             .filter((transition) => transition[0] === first.initialState)
    //             .map<[number, T, number]>(
    //                 (transition) => [initialState, transition[1], transition[2]]
    //             )
    //     );
    //     transitions.push(
    //         ...second.transitions
    //             .filter((transition) => transition[0] === second.initialState)
    //             .map<[number, T, number]>(
    //                 (transition) => [initialState, transition[1], transition[2] + first.stateCounter]
    //             )
    //     );
    //     return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    // }

    // public static alternatives<T>(terms: Builder<T>[]) {
    //     return terms.reduce((first, second) => Builder.either(first, second));
    // }

    // private stateCounter: number;
    // private stackCounter: number;
    // private acceptingStates: number[];
    // private initialState: number;
    // private transitions: [number, T, number | null, number[], number][];

    // private constructor(stateCounter: number, stackSymbolCounter: number, acceptingStates: number[], initialState: number, transitions: [number, T, number | null, number[], number][]) {
    //     this.stateCounter = stateCounter;
    //     this.stackCounter = stackSymbolCounter;
    //     this.acceptingStates = acceptingStates;
    //     this.initialState = initialState;
    //     this.transitions = transitions;
    // }

    // public zeroOrMore(): Builder<T> {
    //     return Builder.any(this);
    // }

    // public oneOrMore(): Builder<T> {
    //     return Builder.many(this);
    // }

    // public optional(): Builder<T> {
    //     return Builder.maybe(this);
    // }

    // public repeat(times: number): Builder<T> {
    //     if (times <= 0) {
    //         return Builder.empty();
    //     } else {
    //         const terms: Builder<T>[] = [];
    //         for (let i = 0; i < times; i++) {
    //             terms.push(this);
    //         }
    //         return Builder.sequence(terms);
    //     }
    // }

    // public followedBy(term: Builder<T>): Builder<T> {
    //     return Builder.succession(this, term);
    // }

    // public build(): PushDownAutomaton<number, T, number> {
    //     return {
    //         acceptingStates: this.acceptingStates,
    //         initialState: this.initialState,
    //         transitions: this.transitions
    //     };
    // }
}
