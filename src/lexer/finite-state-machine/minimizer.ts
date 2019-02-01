import { FiniteStateMachine } from './finite-state-machine';

export class Minimizer {
    public static minimize<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<S, T> {
        // Depth-first search to find reachable states.
        const reachableStates = new Set<S>([]);
        const queue: S[] = [fsm.initialState];
        while (queue.length >= 1) {
            const state = queue.pop()!;
            reachableStates.add(state);

            // Find targets that are not in the set of reachable states yet.
            const nextStates = fsm.transitions
                .filter((transition) => transition[0] === state && !reachableStates.has(transition[2]))
                .map((transition) => transition[2]);
            // Add them to the queue.
            queue.push(...nextStates);
        }

        const acceptingStates = new Set(fsm.acceptingStates);
        const reachableAcceptingStates = new Set([...reachableStates].filter((state) => acceptingStates.has(state)));
        const reachableRejectingStates = new Set([...reachableStates].filter((state) => !acceptingStates.has(state)));

        // Get the actions of all reachable states.
        const alphabet = new Set(
            fsm.transitions
                .filter((transition) => reachableStates.has(transition[0]))
                .map((transition) => transition[1])
        );

        // Hopcroft's algorithm.
        const partitions: Set<Set<S>> = new Set([reachableAcceptingStates, reachableRejectingStates]);
        const waiting: Set<Set<S>> = new Set([reachableAcceptingStates]);
        while (waiting.size >= 1) {
            const [targets] = [...waiting];
            waiting.delete(targets);
            for (const token of alphabet) {
                const sources = new Set(
                    fsm.transitions
                        .filter((transition) => transition[1] === token && targets.has(transition[2]))
                        .map((transition) => transition[0])
                );
                for (const partition of partitions) {
                    const intersection = new Set([...partition].filter((state) => sources.has(state)));
                    const difference = new Set([...partition].filter((state) => !sources.has(state)));
                    if (intersection.size >= 1 && difference.size >= 1) {
                        partitions.delete(partition);
                        partitions.add(intersection);
                        partitions.add(difference);
                        if (waiting.has(partition)) {
                            waiting.delete(partition);
                            waiting.add(intersection);
                            waiting.add(difference);
                        } else {
                            if (intersection.size <= difference.size) {
                                waiting.add(intersection);
                            } else {
                                waiting.add(difference);
                            }
                        }
                    }
                }
            }
        }

        const partitionLeaderMap = new Map(
            [...partitions]
                .map((partition) => [...partition].map<[S, S]>((state) => [state, partition.values().next().value]))
                .reduce<[S, S][]>((flattened, entry) => (flattened.push(...entry), flattened), [])
        );

        return {
            acceptingStates: [...reachableAcceptingStates].filter((state) => state === partitionLeaderMap.get(state)!),
            initialState: partitionLeaderMap.get(fsm.initialState)!,
            transitions: fsm.transitions
                .filter((transition) => transition[0] === partitionLeaderMap.get(transition[0])!)
                .map<[S, T, S]>((transition) => [transition[0], transition[1], partitionLeaderMap.get(transition[2])!])
        };
    }
}
