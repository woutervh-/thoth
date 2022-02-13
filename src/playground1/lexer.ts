import * as fs from "fs";

/**
 * States S, transition alphabet T.
 */
interface FSM<S, T> {
    // The accepting states.
    accepting: S[];

    // The initial state.
    initial: S;

    // Names.
    names: [S, string][];

    // Possible transitions: [S, T, S'] means from state S we can accept input T to move to state S'.
    transitions: [S, T, S][];
}

function toDot<S, T>(fsm: FSM<S, T>, options: { stateToString: (s: S) => string, inputToString: (i: T) => string }): string {
    const lines: string[] = [];
    // header
    lines.push("digraph finite_state_machine {");
    lines.push("rankdir=LR;");
    lines.push("size=\"8,5\"");
    // initial state
    lines.push(`node [style = filled, shape = ${fsm.accepting.includes(fsm.initial) ? "doublecircle" : "circle"}] ${options.stateToString(fsm.initial)};`);
    // accepting states (but not initial)
    if (fsm.accepting.some((s) => s !== fsm.initial)) {
        lines.push(`node [shape = doublecircle, style = solid]; ${fsm.accepting.filter((s) => s !== fsm.initial).map(options.stateToString).join(" ")};`);
    }
    for (const [s, n] of fsm.names) {
        const names = fsm.names.filter(([s2, n]) => s === s2);
        if (n === names[0][1]) {
            lines.push(`${options.stateToString(s)} [label = "${names.map(([s, n]) => n).join(",")}"];`);
        }
    }
    lines.push("node [style = solid];");
    lines.push("node [shape = circle];");
    for (const [s, i, t] of fsm.transitions) {
        lines.push(`${options.stateToString(s)} -> ${options.stateToString(t)} [ label = "${options.inputToString(i)}" ];`);
    }
    lines.push("}");

    return lines.join("\n");
}

interface Empty {
    type: "empty";
}

interface Terminal<T> {
    type: "terminal";
    input: T;
}

interface Alternatives<T> {
    type: "alternatives";
    terms: Term<T>[];
}

interface Sequence<T> {
    type: "sequence";
    terms: Term<T>[];
}

interface Choice<T> {
    type: "choice";
    left: Term<T>;
    right: Term<T>;
}

interface Follows<T> {
    type: "follows";
    left: Term<T>;
    right: Term<T>;
}

interface Many<T> {
    type: "many";
    term: Term<T>;
}

interface Any<T> {
    type: "any";
    term: Term<T>;
}

interface Maybe<T> {
    type: "maybe";
    term: Term<T>;
}

interface Named<T> {
    type: "named";
    name: string;
    term: Term<T>;
}

type Term<T> = Empty | Terminal<T> | Alternatives<T> | Sequence<T> | Choice<T> | Follows<T> | Many<T> | Any<T> | Maybe<T> | Named<T>;

function offsetFSM<T>([count, fsm]: [number, FSM<number, T>], offset: number): [number, FSM<number, T>] {
    return [
        count,
        {
            accepting: fsm.accepting.map((s) => s + offset),
            initial: fsm.initial + offset,
            names: fsm.names.map(([s, n]) => [s + offset, n]),
            transitions: fsm.transitions.map(([s, i, t]) => [s + offset, i, t + offset])
        }
    ];
}

function toFSM<T>(term: Term<T>): [number, FSM<number, T>] {
    switch (term.type) {
        case "empty": {
            return [1, { accepting: [0], initial: 0, names: [], transitions: [] }];
        }
        case "terminal": {
            return [2, { accepting: [1], initial: 0, names: [], transitions: [[0, term.input, 1]] }];
        }
        case "choice": {
            const [leftCount, leftFSM] = toFSM(term.left);
            const [rightCount, rightFSM] = offsetFSM(toFSM(term.right), leftCount);

            const initial = leftCount + rightCount;
            const names = [...leftFSM.names, ...rightFSM.names];

            const accepting = [...leftFSM.accepting, ...rightFSM.accepting];
            if (leftFSM.accepting.includes(leftFSM.initial) || rightFSM.accepting.includes(rightFSM.initial)) {
                if (leftFSM.accepting.includes(leftFSM.initial)) {
                    names.push(...leftFSM.names.filter(([s, n]) => s === leftFSM.initial).map(([s, n]): [number, string] => [initial, n]));
                }
                if (rightFSM.accepting.includes(rightFSM.initial)) {
                    names.push(...rightFSM.names.filter(([s, n]) => s === rightFSM.initial).map(([s, n]): [number, string] => [initial, n]));
                }
                accepting.push(initial);
            }

            const transitions = [
                ...leftFSM.transitions,
                ...rightFSM.transitions,
                ...leftFSM.transitions.filter(([s, i, t]) => s === leftFSM.initial).map(([s, i, t]): [number, T, number] => [initial, i, t]),
                ...rightFSM.transitions.filter(([s, i, t]) => s === rightFSM.initial).map(([s, i, t]): [number, T, number] => [initial, i, t])
            ];

            return [leftCount + rightCount + 1, { accepting, initial, names, transitions }];
        }
        case "follows": {
            const [leftCount, leftFSM] = toFSM(term.left);
            const [rightCount, rightFSM] = offsetFSM(toFSM(term.right), leftCount);

            const initial = leftFSM.initial;
            const names = [...rightFSM.names];

            const accepting = [...rightFSM.accepting];
            if (rightFSM.accepting.includes(rightFSM.initial)) {
                accepting.push(...leftFSM.accepting);
                names.push(...leftFSM.names);
            }

            const transitions = [...leftFSM.transitions, ...rightFSM.transitions];
            for (const a of leftFSM.accepting) {
                transitions.push(...rightFSM.transitions.filter(([s, i, t]) => s === rightFSM.initial).map(([s, i, t]): [number, T, number] => [a, i, t]));
            }

            return [leftCount + rightCount, { accepting, initial, names, transitions }];
        }
        case "alternatives": {
            return toFSM(term.terms.reduce((left, right): Term<T> => ({ type: "choice", left, right })));
        }
        case "sequence": {
            return toFSM(term.terms.reduce((left, right): Term<T> => ({ type: "follows", left, right })));
        }
        case "many": {
            const [count, fsm] = toFSM(term.term);

            const initial = fsm.initial;
            const accepting = fsm.accepting;
            const names = fsm.names;

            const transitions = [...fsm.transitions];
            for (const a of fsm.accepting) {
                transitions.push(...fsm.transitions.filter(([s, i, t]) => s === fsm.initial).map(([s, i, t]): [number, T, number] => [a, i, t]));
            }

            return [count, { accepting, initial, names, transitions }];
        }
        case "maybe": {
            const [count, fsm] = toFSM(term.term);
            const initial = fsm.initial;
            const names = [...fsm.names, ...fsm.names.map(([s, n]): [number, string] => [initial, n])];
            const accepting = [...fsm.accepting, initial];
            const transitions = fsm.transitions;

            return [count, { accepting, initial, names, transitions }];
        }
        case "any": {
            return toFSM({ type: "maybe", term: { type: "many", term: term.term } });
        }
        case "named": {
            const [count, fsm] = toFSM(term.term);
            const initial = fsm.initial;
            const names = fsm.accepting.map((s): [number, string] => [s, term.name]);
            const accepting = fsm.accepting;
            const transitions = fsm.transitions;

            return [count, { accepting, initial, names, transitions }];
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
    const names = accepting.map((ss) => fsm.names.filter(([s, n]) => ss.includes(s)).map(([s, n]): [S[], string] => [ss, n])).reduce((prev, current) => [...prev, ...current]);

    return { accepting, initial, names, transitions };
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
        transitionMap.get(s)?.set(i, t);
    }

    const nameMap = new Map<S, Set<string>>();
    for (const [s, n] of fsm.names) {
        if (!nameMap.has(s)) {
            nameMap.set(s, new Set());
        }
        nameMap.get(s)!.add(n);
    }

    const alphabet = Array.from(new Set(fsm.transitions.filter(([s, i, t]) => reachableSet.has(s)).map(([s, i, t]) => i)));

    const accepting = new Set(fsm.accepting);
    const reachableAccepting = Array.from(reachableSet).filter((s) => accepting.has(s));
    const reachableRejecting = Array.from(reachableSet).filter((s) => !accepting.has(s));

    let lastPartitionSize = 0;
    let partitions: S[][] = [];
    if (reachableAccepting.length >= 1) {
        partitions.push(reachableAccepting);
    }
    if (reachableRejecting.length >= 1) {
        partitions.push(reachableRejecting);
    }

    const newPartitions: S[][] = [];
    for (const oldPartition of partitions) {
        const newPartitionsSplit: S[][] = [];
        for (const state of oldPartition) {
            const stateNames = nameMap.get(state);
            const matchedNewPartition = newPartitionsSplit.find((newPartition) => {
                const partitionState = newPartition[0];
                const partitionNames = nameMap.get(partitionState);
                return stateNames === undefined
                    && partitionNames === undefined
                    || stateNames !== undefined
                    && partitionNames !== undefined
                    && Array.from(stateNames).every((n) => partitionNames.has(n)) && Array.from(partitionNames).every((n) => stateNames.has(n));
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
    lastPartitionSize = partitions.length;
    partitions = newPartitions;

    while (partitions.length > lastPartitionSize) {
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

        lastPartitionSize = partitions.length;
        partitions = newPartitions;
    }

    const partitionsNodeMap: Map<S, S[]> = new Map(
        partitions
            .map((partition) => partition.map<[S, S[]]>((state) => [state, partition]))
            .reduce((entries, partition) => [...entries, ...partition])
    );

    const names: [S[], string][] = [];
    for (const [s, n] of fsm.names) {
        const partition = partitionsNodeMap.get(s)!;
        if (names.some(([s2, n2]) => s2 === partition && n2 === n)) {
            continue;
        }
        names.push([partition, n]);
    }

    return {
        accepting: partitions.filter((partition) => accepting.has(partition[0])),
        initial: partitionsNodeMap.get(fsm.initial)!,
        names,
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
        names: fsm.names.map(([s, n]): [number, string] => [map.get(s)!, n]),
        transitions: fsm.transitions.map(([s, i, t]): [number, T, number] => [map.get(s)!, i, map.get(t)!])
    };
}

function terminal(input: [number, number]): Terminal<[number, number]> {
    return { type: "terminal", input };
}

function choice(left: Term<[number, number]>, right: Term<[number, number]>): Choice<[number, number]> {
    return { type: "choice", left, right };
}

function any(term: Term<[number, number]>): Any<[number, number]> {
    return { type: "any", term };
}

function sequence(...terms: Term<[number, number]>[]): Sequence<[number, number]> {
    return { type: "sequence", terms };
}

function alternatives(...terms: Term<[number, number]>[]): Alternatives<[number, number]> {
    return { type: "alternatives", terms };
}

function named(name: string, term: Term<[number, number]>): Named<[number, number]> {
    return { type: "named", name, term };
}

// const grammar = sequence(
//     named("prefix", any(choice(terminal("a"), terminal("b")))),
//     named("body", sequence(terminal("a"), terminal("b"), terminal("b"))),
//     named("postfix", any(choice(terminal("a"), terminal("b"))))
// );

const grammar = alternatives(
    named("if", sequence(terminal([0x69, 0x69]), terminal([0x66, 0x66]))), // if
    named("int", sequence(terminal([0x69, 0x69]), terminal([0x6E, 0x6E]), terminal([0x74, 0x74]))), // int
    named("identifier", sequence(terminal([0x61, 0x7A]), any(alternatives(terminal([0x61, 0x7A]), terminal([0x5F, 0x5F]), terminal([0x30, 0x39]))))), // a-z(a-z_0-9)+
    named("semicolon", terminal([0x3B, 0x3B]))
);

const [_, fsm] = toFSM(grammar);
const dfa = toNumberState(toDeterministic(fsm));
// TODO: remove deadlocks (state from which no final state is reachable)
const min = toNumberState(toMinimal(dfa));
const dot = toDot(min, { stateToString: (s) => s.toString(), inputToString: (i) => `${Buffer.from([i[0]]).toString()}-${Buffer.from([i[1]]).toString()}` });

fs.writeFileSync(__dirname + "/fsm.dot", dot);

class Lexer {
    private stack: number[][];
    private token: number[];

    public constructor(private fsm: FSM<number, [number, number]>) {
        this.token = [];
        this.stack = [[this.fsm.initial]];
    }

    public write(input?: number) {
        if (input === undefined) {
            if (this.token.length < 1) {
                return;
            }

            const accepting = this.stack[this.stack.length - 1].filter((s) => this.fsm.accepting.includes(s));
            const names = accepting.map((s) => this.fsm.names.filter(([s2, n]) => s === s2).map(([s2, n]) => n)).reduce((prev, current) => [...prev, ...current]);

            console.log("Emit:", this.token, names);

            return;
        }

        const newStates: number[] = [];
        for (const state of this.stack[this.stack.length - 1]) {
            newStates.push(...this.fsm.transitions.filter(([s, i, t]) => s === state && i[0] <= input && input <= i[1]).map(([s, i, t]) => t));
        }

        if (newStates.length < 1) {
            while (this.stack.length >= 1 && !this.stack[this.stack.length - 1].some((s) => this.fsm.accepting.includes(s))) {
                this.stack.pop();
                this.token.pop();
            }

            if (this.stack.length < 1) {
                throw new Error("No accepting states.");
            }

            const accepting = this.stack[this.stack.length - 1].filter((s) => this.fsm.accepting.includes(s));
            const names = accepting.map((s) => this.fsm.names.filter(([s2, n]) => s === s2).map(([s2, n]) => n)).reduce((prev, current) => [...prev, ...current]);
            
            console.log("Emit:", this.token, names);

            this.token = [];
            this.stack = [[this.fsm.initial]];

            this.write(input);
        } else {
            this.token.push(input);
            this.stack.push(newStates);
        }
    }
}

const lexer = new Lexer(min);
const input = "if;int;i;ifi;;;";
for (const c of Buffer.from(input)) {
    lexer.write(c);
}
lexer.write();

export declare const x: number;
