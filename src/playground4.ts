const automaton: PushDownAutomaton<number, string, string> = {
    acceptingStates: [1],
    initialState: 0,
    transitions: [
        [0, 'a', undefined, ['A'], 0],
        [0, 'a', 'A', ['A', 'A'], 0],
        [0, 'b', 'A', [], 1],
        [1, 'b', 'A', [], 1]
    ]
};

const automaton2: PushDownAutomaton<number, string, string> = {
    acceptingStates: [],
    initialState: 0,
    transitions: [
        []
    ]
};

function run<S, T, U>(automaton: PushDownAutomaton<S, T, U>, input: T[]): boolean {
    const stack: U[] = [];
    let currentState = automaton.initialState;
    for (const action of input) {
        const top = stack.pop();
        const transitions = automaton.transitions.filter((transition) =>
            transition[0] === currentState
            && transition[1] === action
            && transition[2] === top
        );
        if (transitions.length >= 2) {
            throw new Error('Encountered underterministic choice.');
        }
        if (transitions.length !== 1) {
            return false;
        }
        const transition = transitions[0];
        stack.push(...transition[3]);
        currentState = transition[4];
    }
    return stack.length === 0 && automaton.acceptingStates.includes(currentState);
}

console.log(run(automaton, ['a', 'a', 'b', 'b']));
