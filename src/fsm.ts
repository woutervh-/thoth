class FSM<S, T> {
    private initialState: S;

    private acceptingStates: Set<S>;

    private transitions: [S, T, S][];

    constructor(initialState: S, acceptingStates: Set<S>, transitions: [S, T, S][]) {
        this.initialState = initialState;
        this.acceptingStates = acceptingStates;
        this.transitions = transitions;
    }

    public minimized() {
        // Depth-first search to find reachable states.
        const reachableStates = new Set<S>([]);
        const queue: S[] = [this.initialState];
        while (queue.length >= 1) {
            const state = queue.pop()!;
            reachableStates.add(state);

            // Find targets that are not in the set of reachable states yet.
            const nextStates = this.transitions
                .filter((transition) => transition[0] === state)
                .filter((transition) => !reachableStates.has(transition[2]))
                .map((transition) => transition[2]);
            // Add them to the queue.
            queue.push(...nextStates);
        }

        const acceptingStates = new Set([...reachableStates].filter((state) => this.acceptingStates.has(state)));
        const rejectingStates = new Set([...reachableStates].filter((state) => !this.acceptingStates.has(state)));

        // Get the actions of all reachable states.
        const alphabet = this.transitions
            .filter((transition) => reachableStates.has(transition[0]))
            .map((transition) => transition[1]);

        // Hopcroft's algorithm.
        const partitions: Set<Set<S>> = new Set([acceptingStates, rejectingStates]);
        const waiting: Set<Set<S>> = new Set([acceptingStates]);
        while (waiting.size >= 1) {
            const targets = waiting.values().next().value;
            waiting.delete(targets);
            for (const token of alphabet) {
                const sources = new Set(
                    this.transitions
                        .filter((transition) => transition[1] === token && targets.has(transition[2]))
                        .map((transition) => transition[0])
                );
                const oldPartitions: Set<S>[] = [];
                const newPartitions: Set<S>[] = [];
                for (const partition of partitions) {
                    const intersection = new Set([...partition].filter((state) => sources.has(state)));
                    const difference = new Set([...partition].filter((state) => !sources.has(state)));
                    if (intersection.size >= 1 && difference.size >= 1) {
                        oldPartitions.push(partition);
                        newPartitions.push(intersection);
                        newPartitions.push(difference);
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
                for (const partition of oldPartitions) {
                    partitions.delete(partition);
                }
                for (const partition of newPartitions) {
                    partitions.add(partition);
                }
            }
        }

        const partitionsList = [...partitions];
        const transitions: [S, T, S][] = [];
        for (const partition of partitionsList) {
            const source = partition.values().next().value;
            const transition = this.transitions.find((transition) => transition[0] === source)!;
            const target = partitionsList.find((partition) => partition.has(transition[2]))!.values().next().value;
            transitions.push([source, transition[1], target]);
        }

        return new FSM(this.initialState, acceptingStates, transitions);
    }
}

const fsm1 = new FSM(
    1,
    new Set([0, 5]),
    [
        [0, 'a', 0],
        [0, 'b', 0],
        [1, 'a', 2],
        [1, 'b', 5],
        [2, 'a', 3],
        [2, 'b', 0],
        [3, 'a', 3],
        [3, 'b', 4],
        [4, 'a', 3],
        [4, 'b', 0],
        [5, 'a', 6],
        [5, 'b', 0],
        [6, 'a', 0],
        [6, 'b', 5]
    ]
);

const fsm2 = fsm1.minimized();

console.log(JSON.stringify((fsm1 as any).transitions));
console.log(JSON.stringify((fsm2 as any).transitions));
