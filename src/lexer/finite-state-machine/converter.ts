import { FiniteStateMachine } from './finite-state-machine';

export class Converter {
    public static convertStateToNumbers<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<number, T> {
        let counter: number = 0;
        const states: Set<S> = new Set([
            fsm.initialState,
            ...fsm.acceptingStates,
            ...fsm.transitions.map((transition) => transition[0]),
            ...fsm.transitions.map((transition) => transition[2])
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
