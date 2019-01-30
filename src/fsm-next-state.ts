class FSMNextState<S, T> {
    private initialState: S;

    private acceptingStates: Set<S>;

    private nextState: (state: S, token: T) => S | null;

    constructor(initialState: S, acceptingStates: Set<S>, nextState: (state: S, token: T) => S | null) {
        this.initialState = initialState;
        this.acceptingStates = acceptingStates;
        this.nextState = nextState;
    }

    public run(input: T[]) {
        if (this.acceptingStates.has(this.initialState)) {
            return 0;
        }
        let currentState = this.initialState;
        for (let i = 0; i < input.length; i++) {
            const nextState = this.nextState(currentState, input[i]);
            if (nextState === null) {
                return null;
            }
            if (this.acceptingStates.has(nextState)) {
                return i + 1;
            }
            currentState = nextState;
        }
        return null;
    }
}

const emptyFSM = new FSMNextState<number, string>(0, new Set([0]), () => 0);
