/**
 * States S, transition alphabet T.
 */
export interface FiniteStateMachine<S, T> {
    // The accepting states.
    acceptingStates: S[];

    // The initial state.
    initialState: S;

    // Possible transitions: [S, T, S'] means from state S we can accept input T to move to state S'.
    transitions: [S, T, S][];
}
