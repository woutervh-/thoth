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
            const actionMap = transitionMap.get(transition[0]);
            if (actionMap !== undefined) {
                actionMap.set(transition[1], transition[2]);
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
                        return alphabet.every((action) => {
                            const target = transitionMap.get(state)!.get(action);
                            const partitionTarget = transitionMap.get(partitionState)!.get(action);
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
}