/**
 * State S, transition alphabet T, stack alphabet U.
 */
export interface PushDownAutomaton<S, T, U> {
    // The accepting states.
    acceptingStates: S[];

    // The initial state.
    initialState: S;

    // Possible transitions: [S, T, U/ε, U[], S'] means from state S we can accept input T and take U or ε (nothing) from the stack and put all of U[] onto the stack to move to state S'.
    transitions: [S, T, U | null, U[], S][];
}
