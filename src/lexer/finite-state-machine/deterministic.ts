import { FiniteStateMachine } from './finite-state-machine';

export class Deterministic {
    public static deterministic<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<S[], T> {
        const alphabet = new Set(fsm.transitions.map((transition) => transition[1]));
        const initialStateSet = new Set([fsm.initialState]);
        const markedSets: Set<Set<S>> = new Set();
        const waiting: Set<S>[] = [initialStateSet];
        const transitions: [Set<S>, T, Set<S>][] = [];
        while (waiting.length >= 1) {
            const stateSet = waiting.pop()!;
            markedSets.add(stateSet);
            for (const action of alphabet) {
                const targets = new Set(
                    fsm.transitions
                        .filter((transition) => stateSet.has(transition[0]) && action === transition[1])
                        .map((transition) => transition[2])
                );
                if (targets.size >= 1) {
                    transitions.push([stateSet, action, targets]);
                    let marked = false;
                    for (const markedSet of markedSets) {
                        const intersection = new Set([...markedSet].filter((state) => targets.has(state)));
                        if (intersection.size === markedSet.size && intersection.size === targets.size) {
                            marked = true;
                            break;
                        }
                    }
                    if (!marked) {
                        waiting.push(targets);
                    }
                }
            }
        }
        const acceptingStateSets = [...markedSets]
            .filter((stateSet) => fsm.acceptingStates.some((state) => stateSet.has(state)));
        return {
            acceptingStates: acceptingStateSets.map((stateSet) => [...stateSet]),
            initialState: [...initialStateSet],
            transitions: transitions.map<[S[], T, S[]]>(
                (transition) => [[...transition[0]], transition[1], [...transition[2]]]
            )
        };
    }
}
