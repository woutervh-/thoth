import { Deterministic } from "./deterministic";
import { FiniteStateMachine } from "./finite-state-machine";
import { Minimizer } from "./minimizer";
import { Numberfier } from "./numberfier";

export class Builder<T> {
    /**
     * Creates a builder for the finite state machine which accepts immediately.
     */
    public static empty<T>() {
        return new Builder<T>(1, [0], 0, []);
    }

    /**
     * Creates a builder for the finite state machine which accepts after a single input.
     * @param input the input which the finite state machine will accept.
     */
    public static terminal<T>(input: T) {
        return new Builder<T>(2, [1], 0, [[0, input, 1]]);
    }

    /**
     * Creates a builder for the finite state machine which accepts the language of the underlying finite state machine once or more.
     * @param term the builder for the underlying finite state machine.
     */
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

    /**
     * Creates a builder for the finite state machine that immediately accepts or accepts the language of the underlying finite state machine.
     * @param term the builder for the underlying finite state machine.
     */
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

    /**
     * Creates a builder for the finite state machine which accepts the language of the underlying finite state machine zero or more times.
     * @param term the builder for the underlying finite state machine.
     */
    public static any<T>(term: Builder<T>) {
        return Builder.maybe(Builder.many(term));
    }

    /**
     * Creates a builder for the finite state machine whichs accepts the language of the first finite state machine followed by the language of the second.
     * @param first the builder for the first finite state machine.
     * @param second the builder for the second finite state machine.
     */
    public static succession<T>(first: Builder<T>, second: Builder<T>) {
        const stateCounter = first.stateCounter + second.stateCounter;
        const initialState = first.initialState;
        const acceptingStates = second.acceptingStates.map((state) => state + first.stateCounter);
        if (second.acceptingStates.includes(second.initialState)) {
            acceptingStates.push(...first.acceptingStates);
        }
        const transitions: [number, T, number][] = [];
        transitions.push(
            ...first.transitions
        );
        transitions.push(
            ...second.transitions
                .map<[number, T, number]>(
                    (transition) => [transition[0] + first.stateCounter, transition[1], transition[2] + first.stateCounter]
                )
        );
        for (const acceptingState of first.acceptingStates) {
            transitions.push(
                ...second.transitions
                    .filter((transition) => transition[0] === second.initialState)
                    .map<[number, T, number]>(
                        (transition) => [acceptingState, transition[1], transition[2] + first.stateCounter]
                    )
            );
        }
        return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    }

    /**
     * Creates a builder for the finite state machine which accepts the languages of the underlying finite state machines on after another in succession.
     * @param terms the builders for the underlying finite state machines.
     */
    public static sequence<T>(terms: Builder<T>[]) {
        return terms.reduce((first, second) => Builder.succession(first, second));
    }

    /**
     * Creates a builder for the finite state machine which accepts either the language of the first finite state machine or the second.
     * @param first the builder for the first finite state machine.
     * @param second the builder for the second finite state machine.
     */
    public static either<T>(first: Builder<T>, second: Builder<T>) {
        const stateCounter = first.stateCounter + second.stateCounter + 1;
        const initialState = first.stateCounter + second.stateCounter;
        const acceptingStates: number[] = [];
        acceptingStates.push(
            ...first.acceptingStates
        );
        acceptingStates.push(
            ...second.acceptingStates
                .map((state) => state + first.stateCounter)
        );
        if (first.acceptingStates.includes(first.initialState) || second.acceptingStates.includes(second.initialState)) {
            acceptingStates.push(initialState);
        }
        const transitions: [number, T, number][] = [];
        transitions.push(
            ...first.transitions
        );
        transitions.push(
            ...second.transitions
                .map<[number, T, number]>(
                    (transition) => [transition[0] + first.stateCounter, transition[1], transition[2] + first.stateCounter]
                )
        );
        transitions.push(
            ...first.transitions
                .filter((transition) => transition[0] === first.initialState)
                .map<[number, T, number]>(
                    (transition) => [initialState, transition[1], transition[2]]
                )
        );
        transitions.push(
            ...second.transitions
                .filter((transition) => transition[0] === second.initialState)
                .map<[number, T, number]>(
                    (transition) => [initialState, transition[1], transition[2] + first.stateCounter]
                )
        );
        return new Builder<T>(stateCounter, acceptingStates, initialState, transitions);
    }

    /**
     * Creates a builder for the finite state machine which accepts any of the languages of the underlying finite state machines.
     * @param terms the builders for the underlying finite state machines.
     */
    public static alternatives<T>(terms: Builder<T>[]) {
        return terms.reduce((first, second) => Builder.either(first, second));
    }

    private stateCounter: number;
    private acceptingStates: number[];
    private initialState: number;
    private transitions: [number, T, number][];

    protected constructor(stateCounter: number, acceptingStates: number[], initialState: number, transitions: [number, T, number][]) {
        this.stateCounter = stateCounter;
        this.acceptingStates = acceptingStates;
        this.initialState = initialState;
        this.transitions = transitions;
    }

    /**
     * Creates a builder for the finite state machine which repeats this builder"s finite state machine zero or more times.
     */
    public zeroOrMore(): Builder<T> {
        return Builder.any(this);
    }

    /**
     * Creates a builder for the finite state machine which repeats this builder"s finite state machine once or more.
     */
    public oneOrMore(): Builder<T> {
        return Builder.many(this);
    }

    /**
     * Creates a builder for the finite state machine which immediately accepts or accepts the language of this builder"s finite state machine.
     */
    public optional(): Builder<T> {
        return Builder.maybe(this);
    }

    /**
     * Creates a builder for the finite state machine which repeats this builder"s finite state machine exactly the specified amount of times.
     * @param times the amount of times to repeat this builder"s finite state machine.
     */
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

    /**
     * Creates a builder for the finite state machine which accepts the language of this builder"s finite state machine followed by the language of the given builder"s finite state machine.
     * @param term builder whose finite state machine will be succeeding this builder"s finite state machine.
     */
    public followedBy(term: Builder<T>): Builder<T> {
        return Builder.succession(this, term);
    }

    /**
     * Creates a builder for the finite state machine which accepts either the language of this builder"s finite state machine or the given builder"s finite state machine.
     * @param term builder whose finite state machine will an alternative to this builder"s finite state machine.
     */
    public or(term: Builder<T>): Builder<T> {
        return Builder.either(this, term);
    }

    /**
     * Complete the build and return the finite state machine.
     * Before returning, the finite state machine will be made deterministic and minimized.
     */
    public build(): FiniteStateMachine<number, T> {
        let fsm: FiniteStateMachine<unknown, T> = {
            acceptingStates: this.acceptingStates,
            initialState: this.initialState,
            transitions: this.transitions
        };
        fsm = Deterministic.deterministic(fsm);
        fsm = Minimizer.minimize(fsm);
        fsm = Minimizer.removeDeadlocks(fsm);
        return Numberfier.convertStateToNumbers(fsm);
    }
}
