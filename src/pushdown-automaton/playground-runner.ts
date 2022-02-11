import { PushDownAutomaton } from "./pushdown-automaton";

export function run<S, T, U>(automaton: PushDownAutomaton<S, T, U>, input: T[]): boolean {
    const stack: U[] = [];
    let currentState = automaton.initialState;
    for (const action of input) {
        const top = stack.length >= 1
            ? stack.pop()!
            : null;
        const transitions = automaton.transitions.filter((transition) =>
            transition[0] === currentState
            && transition[1] === action
            && transition[2] === top
        );
        if (transitions.length >= 2) {
            throw new Error("Encountered underterministic choice.");
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
