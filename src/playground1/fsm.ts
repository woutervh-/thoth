/**
 * States S, transition alphabet T.
 */
interface FSM<S, T> {
    // The accepting states.
    accepting: S[];

    // The initial state.
    initial: S;

    // Possible transitions: [S, T, S'] means from state S we can accept input T to move to state S'.
    transitions: [S, T, S][];
}

function toDot(fsm: FSM<number, string>): string {
    const lines: string[] = [];
    // header
    lines.push("digraph finite_state_machine {");
    lines.push("rankdir=LR;");
    lines.push("size=\"8,5\"");
    // initial state
    lines.push(`node [style = filled, shape = ${fsm.accepting.includes(fsm.initial) ? "doublecircle" : "circle"}] ${fsm.initial};`);
    // accepting states (but not initial)
    if (fsm.accepting.some((s) => s !== fsm.initial)) {
        lines.push(`node [shape = doublecircle, style = solid]; ${fsm.accepting.filter((s) => s !== fsm.initial).join(" ")};`);
    }
    lines.push("node [style = solid];");
    lines.push("node [shape = circle];");
    for (const [s, i, t] of fsm.transitions) {
        lines.push(`${s} -> ${t} [ label = "${i}" ];`);
    }
    lines.push("}");

    return lines.join("\n");
}

interface Empty {
    type: "empty";
}

interface Terminal {
    type: "terminal";
    input: string;
}

interface Alternatives {
    type: "alternatives";
    terms: Term[];
}

interface Sequence {
    type: "sequence";
    terms: Term[];
}

interface Choice {
    type: "choice";
    left: Term;
    right: Term;
}

interface Follows {
    type: "follows";
    left: Term;
    right: Term;
}

interface Many {
    type: "many";
    term: Term;
}

interface Any {
    type: "any";
    term: Term;
}

interface Maybe {
    type: "maybe";
    term: Term;
}

type Term = Empty | Terminal | Alternatives | Sequence | Choice | Follows | Many | Any | Maybe;

function offsetFSM([count, fsm]: [number, FSM<number, string>], offset: number): [number, FSM<number, string>] {
    return [
        count,
        {
            accepting: fsm.accepting.map((s) => s + offset),
            initial: fsm.initial + offset,
            transitions: fsm.transitions.map(([s, i, t]) => [s + offset, i, t + offset])
        }
    ];
}

function toFSM(term: Term): [number, FSM<number, string>] {
    switch (term.type) {
        case "empty": {
            return [1, { accepting: [0], initial: 0, transitions: [] }];
        }
        case "terminal": {
            return [2, { accepting: [1], initial: 0, transitions: [[0, term.input, 1]] }];
        }
        case "choice": {
            const [leftCount, leftFSM] = toFSM(term.left);
            const [rightCount, rightFSM] = offsetFSM(toFSM(term.right), leftCount);

            const initial = leftCount + rightCount;

            const accepting = [...leftFSM.accepting, ...rightFSM.accepting];
            if (leftFSM.accepting.includes(leftFSM.initial) || rightFSM.accepting.includes(rightFSM.initial)) {
                accepting.push(initial);
            }

            const transitions = [
                ...leftFSM.transitions,
                ...rightFSM.transitions,
                ...leftFSM.transitions.filter(([s, i, t]) => s === leftFSM.initial).map(([s, i, t]): [number, string, number] => [initial, i, t]),
                ...rightFSM.transitions.filter(([s, i, t]) => s === rightFSM.initial).map(([s, i, t]): [number, string, number] => [initial, i, t])
            ];

            return [leftCount + rightCount + 1, { accepting, initial, transitions }];
        }
        case "follows": {
            const [leftCount, leftFSM] = toFSM(term.left);
            const [rightCount, rightFSM] = offsetFSM(toFSM(term.right), leftCount);

            const initial = leftFSM.initial;

            const accepting = [...rightFSM.accepting];
            if (rightFSM.accepting.includes(rightFSM.initial)) {
                accepting.push(...leftFSM.accepting);
            }

            const transitions = [...leftFSM.transitions, ...rightFSM.transitions];
            for (const a of leftFSM.accepting) {
                transitions.push(...rightFSM.transitions.filter(([s, i, t]) => s === rightFSM.initial).map(([s, i, t]): [number, string, number] => [a, i, t]));
            }

            return [leftCount + rightCount, { accepting, initial, transitions }];
        }
        case "alternatives": {
            return toFSM(term.terms.reduce((left, right): Term => ({ type: "choice", left, right })));
        }
        case "sequence": {
            return toFSM(term.terms.reduce((left, right): Term => ({ type: "follows", left, right })));
        }
        case "many": {
            const [count, fsm] = toFSM(term.term);

            const initial = fsm.initial;
            const accepting = fsm.accepting;

            const transitions = [...fsm.transitions];
            for (const a of fsm.accepting) {
                transitions.push(...fsm.transitions.filter(([s, i, t]) => s === fsm.initial).map(([s, i, t]): [number, string, number] => [a, i, t]));
            }

            return [count, { accepting, initial, transitions }];
        }
        case "maybe": {
            // const [count, fsm] = toFSM(term.term);

            // const initial = count;
            // const accepting = [...fsm.accepting, initial];

            // const transitions = [
            //     ...fsm.transitions,
            //     ...fsm.transitions.filter(([s, i, t]) => s === fsm.initial).map(([s, i, t]): [number, string, number] => [initial, i, t])
            // ];

            // return [count + 1, { accepting, initial, transitions }];

            const [count, fsm] = toFSM(term.term);
            const initial = fsm.initial;
            const accepting = [...fsm.accepting, initial];
            const transitions = fsm.transitions;

            return [count, { accepting, initial, transitions }];
        }
        case "any": {
            return toFSM({ type: "maybe", term: { type: "many", term: term.term } });
        }
    }
}

function toDeterministic<S, T>(fsm: FSM<S, T>): FSM<S[], T> {
    const alphabet = new Set(fsm.transitions.map(([s, i, t]) => i));
    const initialStateSet = new Set([fsm.initial]);
    const markedSets = new Set<Set<S>>([initialStateSet]);
    const waiting = [initialStateSet];
    const setTransitions: [Set<S>, T, Set<S>][] = [];
    while (waiting.length >= 1) {
        const stateSet = waiting.pop()!;
        for (const input of alphabet) {
            const targets = new Set(fsm.transitions.filter(([s, i, t]) => stateSet.has(s) && i === input).map(([s, i, t]) => t));
            if (targets.size >= 1) {
                let markedSetMatch: Set<S> | null = null;
                for (const markedSet of markedSets) {
                    const intersection = new Set(Array.from(markedSet).filter((s) => targets.has(s)));
                    if (intersection.size === markedSet.size && intersection.size === targets.size) {
                        markedSetMatch = markedSet;
                        break;
                    }
                }
                setTransitions.push([stateSet, input, markedSetMatch ?? targets]);
                if (!markedSetMatch) {
                    markedSets.add(targets);
                    waiting.push(targets);
                }
            }
        }
    }
    const setToArray = new Map<Set<S>, S[]>();
    for (const [s, i, t] of setTransitions) {
        if (!setToArray.has(s)) {
            setToArray.set(s, Array.from(s));
        }
        if (!setToArray.has(t)) {
            setToArray.set(t, Array.from(t));
        }
    }

    const accepting = Array.from(markedSets).filter((stateSet) => fsm.accepting.some((s) => stateSet.has(s))).map((stateSet) => setToArray.get(stateSet)!);
    const initial = setToArray.get(initialStateSet)!;
    const transitions = setTransitions.map(([s, i, t]): [S[], T, S[]] => [setToArray.get(s)!, i, setToArray.get(t)!]);

    return { accepting, initial, transitions };
}

function toMinimal<S, T>(fsm: FSM<S, T>): FSM<S[], T> {
    const reachableSet = new Set<S>();
    const queue = [fsm.initial];
    while (queue.length >= 1) {
        const state = queue.pop()!;
        reachableSet.add(state);

        const next = fsm.transitions.filter(([s, i, t]) => s === state && !reachableSet.has(t)).map(([s, i, t]) => t);
        queue.push(...next);
    }

    const transitionMap = new Map<S, Map<T, S>>();
    for (const state of reachableSet) {
        transitionMap.set(state, new Map());
    }
    for (const [s, i, t] of fsm.transitions) {
        const sourceMap = transitionMap.get(s);
        if (sourceMap) {
            sourceMap.set(i, t);
        }
    }

    const alphabet = Array.from(new Set(fsm.transitions.filter(([s, i, t]) => reachableSet.has(s)).map(([s, i, t]) => i)));

    const accepting = new Set(fsm.accepting);
    const reachableAccepting = Array.from(reachableSet).filter((s) => accepting.has(s));
    const reachableRejecting = Array.from(reachableSet).filter((s) => !accepting.has(s));

    let lastParitionSize = 0;
    let partitions: S[][] = [];
    if (reachableAccepting.length >= 1) {
        partitions.push(reachableAccepting);
    }
    if (reachableRejecting.length >= 1) {
        partitions.push(reachableRejecting);
    }
    while (partitions.length > lastParitionSize) {
        const partitionsNodeMap = new Map<S, S[]>(partitions.map((partition) => partition.map((state): [S, S[]] => [state, partition])).reduce((entries, partition) => [...entries, ...partition]));
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
                if (!matchedNewPartition) {
                    newPartitionsSplit.push([state]);
                } else {
                    matchedNewPartition.push(state);
                }
            }
            for (const partition of newPartitionsSplit) {
                newPartitions.push(partition);
            }
        }

        lastParitionSize = partitions.length;
        partitions = newPartitions;
    }

    const partitionsNodeMap: Map<S, S[]> = new Map(
        partitions
            .map((partition) => partition.map<[S, S[]]>((state) => [state, partition]))
            .reduce((entries, partition) => [...entries, ...partition])
    );

    return {
        accepting: partitions.filter((partition) => accepting.has(partition[0])),
        initial: partitionsNodeMap.get(fsm.initial)!,
        transitions: fsm.transitions
            .filter(([s, i, t]) => reachableSet.has(s))
            .filter(([s, i, t]) => partitionsNodeMap.get(s)![0] === s)
            .map(([s, i, t]): [S[], T, S[]] => [partitionsNodeMap.get(s)!, i, partitionsNodeMap.get(t)!])
    };
}

function toNumberState<S, T>(fsm: FSM<S, T>): FSM<number, T> {
    let counter = 0;
    const states = [
        fsm.initial,
        ...fsm.accepting,
        ...fsm.transitions.map(([s, i, t]) => s),
        ...fsm.transitions.map(([s, i, t]) => t)
    ];
    const map = new Map<S, number>();
    for (const s of states) {
        if (!map.has(s)) {
            map.set(s, counter++);
        }
    }
    return {
        accepting: fsm.accepting.map((s) => map.get(s)!),
        initial: map.get(fsm.initial)!,
        transitions: fsm.transitions.map(([s, i, t]): [number, T, number] => [map.get(s)!, i, map.get(t)!])
    };
}

function terminal(input: string): Terminal {
    return { type: "terminal", input };
}

function choice(left: Term, right: Term): Choice {
    return { type: "choice", left, right };
}

function any(term: Term): Any {
    return { type: "any", term };
}

function sequence(...terms: Term[]): Sequence {
    return { type: "sequence", terms };
}

const grammar = sequence(
    any(choice(terminal("a"), terminal("b"))),
    terminal("a"),
    terminal("b"),
    terminal("b"),
    any(choice(terminal("a"), terminal("b")))
);

const [_, fsm] = toFSM(grammar);
const dfa = toNumberState(toDeterministic(fsm));
// TODO: remove unreachable states
const min = toNumberState(toMinimal(dfa));
const dot = toDot(min);

console.log(dot);

export declare const x: number;
