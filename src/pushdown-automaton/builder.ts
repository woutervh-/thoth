import { PushDownAutomaton } from './pushdown-automaton';

export class Builder<T> {
    public static empty<T>() {
        return new Builder<T>(1, 0, [0], 0, []);
    }

    public static terminal<T>(action: T) {
        return new Builder<T>(2, 0, [1], 0, [[0, action, undefined, [], 1]]);
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

    public static succession<T>(first: Builder<T>, second: Builder<T>) {
        const stateCounter = first.stateCounter + second.stateCounter;
        const stackCounter = first.stackCounter + second.stackCounter;
        const initialState = first.initialState;
        const acceptingStates = second.acceptingStates.map((state) => state + first.stateCounter);
        if (second.acceptingStates.includes(second.initialState)) {
            acceptingStates.push(...first.acceptingStates);
        }
        const transitions: [number, T, number | undefined, number[], number][] = [];
        transitions.push(
            ...first.transitions
        );
        transitions.push(
            ...second.transitions
                .map<[number, T, number | undefined, number[], number]>(
                    (transition) => [
                        transition[0] + first.stateCounter,
                        transition[1],
                        transition[2] === undefined ? undefined : transition[2] + first.stackCounter,
                        transition[3].map((symbol) => symbol + first.stackCounter),
                        transition[4] + first.stateCounter
                    ]
                )
        );
        for (const acceptingState of first.acceptingStates) {
            transitions.push(
                ...second.transitions
                    .filter((transition) => transition[0] === second.initialState)
                    .map<[number, T, number | undefined, number[], number]>(
                        (transition) => [
                            acceptingState,
                            transition[1],
                            transition[2] === undefined ? undefined : transition[2] + first.stackCounter,
                            transition[3].map((symbol) => symbol + first.stackCounter),
                            transition[4] + first.stateCounter
                        ]
                    )
            );
        }
        return new Builder<T>(stateCounter, stackCounter, acceptingStates, initialState, transitions);
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

    private stateCounter: number;
    private stackCounter: number;
    private acceptingStates: number[];
    private initialState: number;
    private transitions: [number, T, number | undefined, number[], number][];

    private constructor(stateCounter: number, stackSymbolCounter: number, acceptingStates: number[], initialState: number, transitions: [number, T, number | undefined, number[], number][]) {
        this.stateCounter = stateCounter;
        this.stackCounter = stackSymbolCounter;
        this.acceptingStates = acceptingStates;
        this.initialState = initialState;
        this.transitions = transitions;
    }

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

    public followedBy(term: Builder<T>): Builder<T> {
        return Builder.succession(this, term);
    }

    public build(): PushDownAutomaton<number, T, number> {
        return {
            acceptingStates: this.acceptingStates,
            initialState: this.initialState,
            transitions: this.transitions
        };
    }
}
