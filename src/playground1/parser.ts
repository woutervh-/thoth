import * as fs from "fs";

// -----------------------------------------------------------

interface NonTerminal {
    type: "non-terminal";
    name: string;
}

interface Terminal<T> {
    type: "terminal";
    terminal: T;
}

type Term<T> = NonTerminal | Terminal<T>;

interface Grammar<T> {
    initial: string;
    rules: { [key: string]: Term<T>[][] };
}

function stringifyGrammar<T>(grammar: Grammar<T>) {
    return Object.keys(grammar.rules)
        .map((nonTerminal) => {
            return grammar.rules[nonTerminal].length >= 1
                ? `${nonTerminal} → ${grammar.rules[nonTerminal]
                    .map((sequence) => sequence.length >= 1
                        ? sequence.map((term) => term.type === "non-terminal" ? term.name : term.terminal).join(" ")
                        : "ε"
                    )
                    .join(" | ")}`
                : `${nonTerminal} → ∅`;
        })
        .join("\n");
}

function stringifyParseState(parseState: ParseState, grammar: Grammar<unknown>) {
    const sequence = grammar.rules[parseState.nonTerminal][parseState.sequence];
    const activeTermIndex = parseState.term;
    let sequenceString = sequence.length >= 1
        ? sequence.map((term, index) => (activeTermIndex === index ? "•" : "") + (term.type === "non-terminal" ? term.name : term.terminal)).join(" ")
        : "ε";
    if (activeTermIndex === sequence.length) {
        sequenceString += "•";
    }
    return sequenceString;
}

function toDot(derivations: ParseState[], grammar: Grammar<unknown>): string {
    const lines: string[] = [];
    // header
    lines.push("digraph parse_states {");
    lines.push("ratio=fill;");
    lines.push("node [style=fill];");

    const nameMap = new Map<ParseState, string>();
    const queue = derivations.slice();
    while (queue.length >= 1) {
        const derivation = queue.pop()!;
        if (nameMap.has(derivation)) {
            continue;
        }
        const relatives = new Set(derivation.children);
        if (derivation.parent) {
            relatives.add(derivation.parent);
        }
        for (const relative of relatives) {
            queue.push(relative);
        }
        nameMap.set(derivation, `t${nameMap.size}`);
    }

    const nodes: string[] = [];
    const edges: string[] = [];
    for (const [derivation, name] of nameMap) {
        for (const child of derivation.children) {
            edges.push(`${name} -> ${nameMap.get(child)!};`);
        }
        if (derivation.parent) {
            edges.push(`${name} -> ${nameMap.get(derivation.parent)!};`);
        }
        const label = stringifyParseState(derivation, grammar).replace(/•/g, "&bull;");
        let color: string;
        if (derivation.term >= grammar.rules[derivation.nonTerminal][derivation.sequence].length) {
            color = "darkgrey";
        } else {
            color = "white";
        }
        nodes.push(`${name} [fillcolor="${color}", label="${derivation.nonTerminal} &rarr; ${label} (${derivation.token})"];`);
    }

    lines.push(...edges);
    lines.push(...nodes);
    lines.push("}");

    return lines.join("\n");
}

function sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
    if (sequence.length >= 1) {
        const firstTerm = sequence[0];
        return firstTerm.type === "non-terminal" && firstTerm.name === nonTerminal;
    }
    return false;
}

function removeDirectLeftRecursion<T>(oldNonTerminal: string, newNonTerminal: string, sequences: Term<T>[][]): [Term<T>[][], Term<T>[][]] {
    const newSequencesA: Term<T>[][] = [];
    const newSequencesB: Term<T>[][] = [];

    for (const sequence of sequences) {
        if (sequenceStartsWithNonTerminal(sequence, oldNonTerminal)) {
            const [, ...rest] = sequence;
            newSequencesB.push(rest);
            newSequencesB.push([...rest, { type: "non-terminal", name: newNonTerminal }]);
        } else {
            newSequencesA.push(sequence);
            newSequencesA.push([...sequence, { type: "non-terminal", name: newNonTerminal }]);
        }
    }

    return [newSequencesA, newSequencesB];
}

function removeAllLeftRecursion<T>(grammar: Grammar<T>): Grammar<T> {
    const orderedNonTerminals = Object.keys(grammar.rules);
    const newGrammar: Grammar<T> = { initial: grammar.initial, rules: { ...grammar.rules } };
    for (let i = 0; i < orderedNonTerminals.length; i++) {
        const oldNonTerminal = orderedNonTerminals[i];
        const oldSequencesA = newGrammar.rules[oldNonTerminal];
        const newSequencesA = new Set(oldSequencesA);
        for (let j = 0; j < i; j++) {
            for (const sequenceA of oldSequencesA) {
                if (sequenceStartsWithNonTerminal(sequenceA, orderedNonTerminals[j])) {
                    const [, ...rest] = sequenceA;
                    newSequencesA.delete(sequenceA);
                    const sequencesB = newGrammar.rules[orderedNonTerminals[j]];
                    for (const sequenceB of sequencesB) {
                        newSequencesA.add([...sequenceB, ...rest]);
                    }
                }
            }
        }
        const newNonTerminal = `${oldNonTerminal}'`;
        const [sequencesA, sequencesB] = removeDirectLeftRecursion(oldNonTerminal, newNonTerminal, Array.from(newSequencesA));
        newGrammar.rules[oldNonTerminal] = sequencesA;
        newGrammar.rules[newNonTerminal] = sequencesB;
    }
    return newGrammar;
}

const grammar: Grammar<string> = {
    initial: "E",
    rules: {
        E: [
            [{ type: "non-terminal", name: "E" }, { type: "terminal", terminal: "+" }, { type: "non-terminal", name: "E" }],
            [{ type: "terminal", terminal: "a" }]
        ]
    }
};

const grammarNonRecursive = removeAllLeftRecursion(grammar);

interface ParseState {
    nonTerminal: string;
    sequence: number;
    term: number;
    token: number;
    parents: Set<ParseState>;
    children: Set<ParseState>;
}

// interface ParseState {
//     nodes: ParseStateNode[];
//     children: Map<ParseState, ParseState[]>;
//     parents: Map<ParseState, ParseState[]>;
// }

// class ParseStateCollection {
//     private parseStates = new Map<string, ParseState>();

//     public getOrAdd(parseState: ParseState): ParseState {
//         const id = ParseStateCollection.parseStateToId(parseState);
//         if (!this.parseStates.has(id)) {
//             this.parseStates.set(id, parseState);
//         }
//         return this.parseStates.get(id)!;
//     }

//     public clone(): ParseStateCollection {
//         const clone = new ParseStateCollection();
//         for (const parseState of this.parseStates.values()) {
//             clone.getOrAdd(parseState);
//         }
//         return clone;
//     }

//     public size(): number {
//         return this.parseStates.size;
//     }

//     public pop(): ParseState | null {
//         const next = this.parseStates.keys().next();
//         if (next.done) {
//             return null;
//         } else {
//             const parseState = this.parseStates.get(next.value)!;
//             this.parseStates.delete(next.value);
//             return parseState;
//         }
//     }

//     public slice(): ParseState[] {
//         return Array.from(this.parseStates.values());
//     }

//     private static parseStateToId(parseState: ParseState): string {
//         return `${parseState.nonTerminal}-${parseState.sequence}-${parseState.term}-${parseState.token}`;
//     }
// }

class Parser<T> {
    private parseStates: ParseState[] = [];
    private token = 0;

    public constructor(private grammar: Grammar<T>) {
        for (let i = 0; i < grammar.rules[grammar.initial].length; i++) {
            this.parseStates.push({
                nonTerminal: grammar.initial,
                sequence: i,
                term: 0,
                token: 0,
                parents: new Set(),
                children: new Set()
            });
        }
    }

    public write(token?: T) {
        const next: ParseState[] = [];
        const remaining = this.parseStates.slice();

        while (remaining.length >= 1) {
            const current = remaining.pop()!;

            const sequence = this.grammar.rules[current.nonTerminal][current.sequence];

            if (current.term >= sequence.length) {
                if (current.parent) {
                    const parentTerm = this.grammar.rules[current.parent.nonTerminal][current.parent.sequence][current.parent.term];
                    if (parentTerm && parentTerm.type === "non-terminal" && parentTerm.name === current.nonTerminal) {
                        current.parent.term += 1;
                    }
                    Parser.
                    const parent: ParseState = remaining.getOrAdd({
                        nonTerminal: current.parent.nonTerminal,
                        sequence: current.parent.sequence,
                        term: current.parent.term + 1,
                        token: current.parent.token,
                        parent: current.parent.parent,
                        children: new Set()
                    });
                    parent.children.add(current);
                    current.parent = parent;
                    // parseState.parent.children.add(parseState);
                    // remainingParseStates.getOrAdd(parseState.parent);
                } else if (!token) {
                    Parser.addOrGet(current, next);
                }
                // } else if (token) {
            } else {
                const term = sequence[current.term];
                switch (term.type) {
                    case "terminal": {
                        if (term.terminal === token) {
                            current.term += 1;
                            Parser.addOrGet({ ...current, term: current.term + 1 }, next);
                        }
                        break;
                    }
                    case "non-terminal": {
                        const rules = this.grammar.rules[term.name];
                        for (let i = 0; i < rules.length; i++) {
                            const child = Parser.addOrGet({
                                nonTerminal: term.name,
                                sequence: i,
                                term: 0,
                                token: this.token,
                                parents: new Set(),
                                children: new Set()
                            }, remaining);
                            child.parents.add(current);
                        }
                        break;
                    }
                }
            }
        }

        // console.log("==========");
        // console.log(token);
        // console.log("----------");
        // for (const parseState of this.parseStates) {
        //     console.log(stringifyParseState(parseState, this.grammar));
        // }
        // console.log("----------");
        // for (const parseState of nextParseStates) {
        //     console.log(stringifyParseState(parseState, this.grammar));
        // }

        this.parseStates = next;
        this.token += 1;
    }

    public getDerivations(): ParseState[] {
        return this.parseStates.slice();
    }

    private static addOrGet(parseState: ParseState, parseStates: ParseState[]): ParseState {
        const found = parseStates.find((other) => {
            return other.nonTerminal === parseState.nonTerminal
                && other.sequence === parseState.sequence
                && other.term === parseState.term
                && other.token === parseState.token;
        });
        if (found) {
            return found;
        } else {
            parseStates.push(parseState);
            return parseState;
        }
    }
}

const parser = new Parser(grammarNonRecursive);
parser.write("a");
parser.write("+");
parser.write("a");
parser.write("+");
parser.write("a");
parser.write();

fs.writeFileSync(__dirname + "/parser-grammar.txt", stringifyGrammar(grammar));
fs.writeFileSync(__dirname + "/parser-grammar-non-recursive.txt", stringifyGrammar(grammarNonRecursive));
fs.writeFileSync(__dirname + "/parser-states.dot", toDot(parser.getDerivations(), grammarNonRecursive));
