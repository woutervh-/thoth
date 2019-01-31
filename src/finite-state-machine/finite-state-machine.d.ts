export interface FiniteStateMachine<S, T> {
    acceptingStates: S[];
    initialState: S;
    transitions: [S, T, S][];
}
