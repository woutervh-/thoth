import { FiniteStateMachine } from './finite-state-machine';

export class Builder<T> {
    public static empty<T>() {
        return new Builder<T>(1, [0], 0, []);
    }

    public static terminal<T>(action: T) {
        return new Builder<T>(2, [1], 0, [[0, action, 1]]);
    }

    public static many<T>(term: Builder<T>) {
        const transitionsFromInitialState = term.transitions.filter((transition) => transition[0] === term.initialState);
        const transitions: [number, T, number][] = [];
        transitions.push(...term.transitions);
        for (const acceptingState of term.acceptingStates) {
            transitions.push(
                ...transitionsFromInitialState.map<[number, T, number]>((transition) =>
                    [acceptingState, transition[1], transition[2]]
                )
            );
        }
        return new Builder<T>(term.stateCounter, term.acceptingStates, term.initialState, transitions);
    }

    public static maybe<T>(term: Builder<T>) {
        let stateCounter = term.stateCounter;
        const initialState = stateCounter++;
        const transitions: [number, T, number][] = [];
        transitions.push(...term.transitions);
        transitions.push(
            ...term.transitions
                .filter((transition) => transition[0] === term.initialState)
                .map<[number, T, number]>((transition) => [initialState, transition[1], transition[2]])
        );
        const acceptingStates = [...term.acceptingStates, initialState];
        return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    }

    public static any<T>(term: Builder<T>) {
        return Builder.maybe(Builder.many(term));
    }

    public static sequence<T>(terms: Builder<T>[]) {
        const stateCounterOffsets: number[] = [0];
        for (let i = 1; i < terms.length; i++) {
            stateCounterOffsets.push(stateCounterOffsets[i - 1] + terms[i - 1].stateCounter);
        }

        const stateMappings: Map<number, number>[] = terms.map(() => new Map());
        for (let i = 0; i < terms.length; i++) {
            for (const transition of terms[i].transitions) {
                stateMappings[i].set(transition[0], transition[0] + stateCounterOffsets[i]);
                stateMappings[i].set(transition[2], transition[2] + stateCounterOffsets[i]);
            }
        }

        const stateCounter = stateCounterOffsets[stateCounterOffsets.length - 1] + terms[terms.length - 1].stateCounter;
        const initialState = stateMappings[0].get(terms[0].initialState)!;
        const acceptingStates = terms[terms.length - 1].acceptingStates.map((state) => stateMappings[stateMappings.length - 1].get(state)!);

        const transitions: [number, T, number][] = [];
        for (let i = 0; i < terms.length; i++) {
            transitions.push(
                ...terms[i].transitions.map<[number, T, number]>(
                    (transition) => [stateMappings[i].get(transition[0])!, transition[1], stateMappings[i].get(transition[2])!]
                )
            );
            if (i >= 1) {
                for (const acceptingState of terms[i - 1].acceptingStates) {
                    transitions.push(
                        ...terms[i].transitions
                            .filter((transition) => transition[0] === terms[i].initialState)
                            .map<[number, T, number]>(
                                (transition) => [stateMappings[i - 1].get(acceptingState)!, transition[1], stateMappings[i].get(transition[2])!]
                            )
                    );
                }
            }
        }

        return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    }

    public static alternatives<T>(terms: Builder<T>[]) {
        const stateCounterOffsets: number[] = [0];
        for (let i = 1; i < terms.length; i++) {
            stateCounterOffsets.push(stateCounterOffsets[i - 1] + terms[i - 1].stateCounter);
        }

        let stateCounter = stateCounterOffsets[stateCounterOffsets.length - 1] + terms[terms.length - 1].stateCounter;

        const stateMappings: Map<number, number>[] = terms.map(() => new Map());
        for (let i = 0; i < terms.length; i++) {
            for (const transition of terms[i].transitions) {
                stateMappings[i].set(transition[0], transition[0] + stateCounterOffsets[i]);
                stateMappings[i].set(transition[2], transition[2] + stateCounterOffsets[i]);
            }
            stateMappings[i].set(terms[i].initialState, stateCounter);
        }

        const transitions: [number, T, number][] = [];
        for (let i = 0; i < terms.length; i++) {
            transitions.push(
                ...terms[i].transitions.map<[number, T, number]>(
                    (transition) => [stateMappings[i].get(transition[0])!, transition[1], stateMappings[i].get(transition[2])!]
                )
            );
        }

        const acceptingStates: number[] = [];
        for (let i = 0; i < terms.length; i++) {
            acceptingStates.push(
                ...terms[i].acceptingStates.map((state) => stateMappings[i].get(state)!)
            );
        }

        const initialState = stateCounter++;

        return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    }

    private stateCounter: number;
    private acceptingStates: number[];
    private initialState: number;
    private transitions: [number, T, number][];

    private constructor(stateCounter: number, acceptingStates: number[], initialState: number, transitions: [number, T, number][]) {
        this.stateCounter = stateCounter;
        this.acceptingStates = acceptingStates;
        this.initialState = initialState;
        this.transitions = transitions;
    }

    public zeroOrMore(): Builder<T> {
        return Builder.any(this);
    }

    public oneOrMore(): Builder<T> {
        return Builder.many(this);
    }

    public optional(): Builder<T> {
        return Builder.maybe(this);
    }

    public repeat(times: number): Builder<T> {
        if (times <= 0) {
            return Builder.empty();
        } else {
            const terms: Builder<T>[] = [];
            for (let i = 0; i < times; i++) {
                terms.push(this);
            }
            return Builder.sequence(terms);
        }
    }

    public followedBy(term: Builder<T>) {
        return Builder.sequence([this, term]);
    }

    public build(): FiniteStateMachine<number, T> {
        return {
            acceptingStates: this.acceptingStates,
            initialState: this.initialState,
            transitions: this.transitions
        };
    }
}
