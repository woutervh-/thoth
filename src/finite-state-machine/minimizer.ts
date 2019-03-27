import { FiniteStateMachine } from './finite-state-machine';

export class Minimizer {
    public static minimize<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<S[], T> {
        const reachableStates = new Set<S>();
        const queue: S[] = [fsm.initialState];
        while (queue.length >= 1) {
            const state = queue.pop()!;
            reachableStates.add(state);

            const nextStates = fsm.transitions
                .filter((transition) => transition[0] === state && !reachableStates.has(transition[2]))
                .map((transition) => transition[2]);
            queue.push(...nextStates);
        }

        const transitionMap: Map<S, Map<T, S>> = new Map();
        for (const state of reachableStates) {
            transitionMap.set(state, new Map());
        }
        for (const transition of fsm.transitions) {
            const inputMap = transitionMap.get(transition[0]);
            if (inputMap !== undefined) {
                inputMap.set(transition[1], transition[2]);
            }
        }

        const alphabet = [...new Set(
            fsm.transitions
                .filter((transition) => reachableStates.has(transition[0]))
                .map((transition) => transition[1])
        )];

        const acceptingStates = new Set(fsm.acceptingStates);
        const reachableAcceptingStates = [...reachableStates].filter((state) => acceptingStates.has(state));
        const reachableRejectingStates = [...reachableStates].filter((state) => !acceptingStates.has(state));

        let previousPartitionsSize = 0;
        let partitions: S[][] = [];
        if (reachableAcceptingStates.length >= 1) {
            partitions.push(reachableAcceptingStates);
        }
        if (reachableRejectingStates.length >= 1) {
            partitions.push(reachableRejectingStates);
        }
        while (partitions.length > previousPartitionsSize) {
            const partitionsNodeMap: Map<S, S[]> = new Map(
                partitions
                    .map((partition) => partition.map<[S, S[]]>((state) => [state, partition]))
                    .reduce((entries, partition) => [...entries, ...partition])
            );

            const newPartitions: S[][] = [];
            for (const oldPartition of partitions) {
                const newPartitionsSplit: S[][] = [];
                for (const state of oldPartition) {
                    const matchedNewPartition = newPartitionsSplit.find((newPartition) => {
                        const partitionState = newPartition[0];
                        return alphabet.every((input) => {
                            const target = transitionMap.get(state)!.get(input);
                            const partitionTarget = transitionMap.get(partitionState)!.get(input);
                            return target === undefined
                                && partitionTarget === undefined
                                || target !== undefined
                                && partitionTarget !== undefined
                                && partitionsNodeMap.get(target) === partitionsNodeMap.get(partitionTarget);
                        });
                    });
                    if (matchedNewPartition === undefined) {
                        newPartitionsSplit.push([state]);
                    } else {
                        matchedNewPartition.push(state);
                    }
                }
                for (const partition of newPartitionsSplit) {
                    newPartitions.push(partition);
                }
            }

            previousPartitionsSize = partitions.length;
            partitions = newPartitions;
        }

        const partitionsNodeMap: Map<S, S[]> = new Map(
            partitions
                .map((partition) => partition.map<[S, S[]]>((state) => [state, partition]))
                .reduce((entries, partition) => [...entries, ...partition])
        );

        return {
            acceptingStates: partitions.filter((partition) => acceptingStates.has(partition[0])),
            initialState: partitionsNodeMap.get(fsm.initialState)!,
            transitions: fsm.transitions
                .filter((transition) => reachableStates.has(transition[0]))
                .filter((transition) => partitionsNodeMap.get(transition[0])![0] === transition[0])
                .map<[S[], T, S[]]>((transition) => [partitionsNodeMap.get(transition[0])!, transition[1], partitionsNodeMap.get(transition[2])!])
        };
    }

    public static removeDeadlocks<S, T>(fsm: FiniteStateMachine<S, T>): FiniteStateMachine<S, T> {
        const states = new Set<S>([fsm.initialState, ...fsm.acceptingStates]);
        for (const transition of fsm.transitions) {
            states.add(transition[0]);
            states.add(transition[2]);
        }
        const reverseReachabilityMap: Map<S, Set<S>> = new Map();
        for (const state of states) {
            reverseReachabilityMap.set(state, new Set());
        }
        for (const transition of fsm.transitions) {
            reverseReachabilityMap.get(transition[2])!.add(transition[0]);
        }
        const reverseReachableStates = new Set<S>(fsm.acceptingStates);
        const queue = [...fsm.acceptingStates];
        while (queue.length >= 1) {
            const targetState = queue.pop()!;
            for (const sourceState of reverseReachabilityMap.get(targetState)!) {
                if (!reverseReachableStates.has(sourceState)) {
                    reverseReachableStates.add(sourceState);
                    queue.push(sourceState);
                }
            }
        }

        return {
            acceptingStates: fsm.acceptingStates,
            initialState: fsm.initialState,
            transitions: fsm.transitions
                .filter((transition) => reverseReachableStates.has(transition[0]) && reverseReachableStates.has(transition[2]))
        };
    }
}
