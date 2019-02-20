export interface PushDownAutomaton<S, T, U> {
    acceptingStates: S[];
    initialState: S;
    // transition [q, s, z, [z', z], q']: if the input symbol s is read, and the stack has symbol z, move from state q to q', and put [z', z] instead of z on the stack
    transitions: [S, T, U, [U, U], S][];
}
