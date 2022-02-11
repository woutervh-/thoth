import { FiniteStateMachine } from "./finite-state-machine";

export class Numberfier {
    public static convertStateToNumbers<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<number, T> {
        let counter = 0;
        const states: Set<S> = new Set([
            fsm.initialState,
            ...fsm.transitions.map((transition) => transition[0]),
            ...fsm.transitions.map((transition) => transition[2]),
            ...fsm.acceptingStates
        ]);
        const stateMap: Map<S, number> = new Map();
        for (const state of states) {
            stateMap.set(state, counter++);
        }
        return {
            acceptingStates: fsm.acceptingStates.map((state) => stateMap.get(state)!),
            initialState: stateMap.get(fsm.initialState)!,
            transitions: fsm.transitions.map<[number, T, number]>(
                (transition) => [stateMap.get(transition[0])!, transition[1], stateMap.get(transition[2])!]
            )
        };
    }
}
