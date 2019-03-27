import { FiniteStateMachine } from './finite-state-machine';

export class Deterministic {
    public static deterministic<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<S[], T> {
        const alphabet = new Set(fsm.transitions.map((transition) => transition[1]));
        const initialStateSet = new Set([fsm.initialState]);
        const markedSets: Set<Set<S>> = new Set([initialStateSet]);
        const waiting: Set<S>[] = [initialStateSet];
        const transitions: [Set<S>, T, Set<S>][] = [];
        while (waiting.length >= 1) {
            const stateSet = waiting.pop()!;
            for (const input of alphabet) {
                const targets = new Set(
                    fsm.transitions
                        .filter((transition) => stateSet.has(transition[0]) && input === transition[1])
                        .map((transition) => transition[2])
                );
                if (targets.size >= 1) {
                    let markedSetMatch: Set<S> | null = null;
                    for (const markedSet of markedSets) {
                        const intersection = new Set([...markedSet].filter((state) => targets.has(state)));
                        if (intersection.size === markedSet.size && intersection.size === targets.size) {
                            markedSetMatch = markedSet;
                            break;
                        }
                    }
                    transitions.push([
                        stateSet,
                        input,
                        markedSetMatch === null
                            ? targets
                            : markedSetMatch
                    ]);
                    if (markedSetMatch === null) {
                        markedSets.add(targets);
                        waiting.push(targets);
                    }
                }
            }
        }
        const setToArrayMap: Map<Set<S>, S[]> = new Map();
        for (const transition of transitions) {
            if (!setToArrayMap.has(transition[0])) {
                setToArrayMap.set(transition[0], [...transition[0]]);
            }
            if (!setToArrayMap.has(transition[2])) {
                setToArrayMap.set(transition[2], [...transition[2]]);
            }
        }
        const acceptingStateSets = [...markedSets]
            .filter((stateSet) => fsm.acceptingStates.some((state) => stateSet.has(state)));
        return {
            acceptingStates: acceptingStateSets.map((stateSet) => setToArrayMap.get(stateSet)!),
            initialState: setToArrayMap.get(initialStateSet)!,
            transitions: transitions.map<[S[], T, S[]]>(
                (transition) => [setToArrayMap.get(transition[0])!, transition[1], setToArrayMap.get(transition[2])!]
            )
        };
    }
}
