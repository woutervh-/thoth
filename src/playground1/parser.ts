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
    if (activeTermIndex >= sequence.length) {
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
        const relatives = derivation.children.slice();
        if (derivation.parent) {
            relatives.push(derivation.parent);
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
    parent: ParseState | null;
    children: ParseState[];
}

class Parser<T> {
    private derivations: ParseState[] = [];
    private token = 0;

    public constructor(private grammar: Grammar<T>) {
        for (let i = 0; i < grammar.rules[grammar.initial].length; i++) {
            this.derivations.push({
                nonTerminal: grammar.initial,
                sequence: i,
                term: 0,
                token: 0,
                parent: null,
                children: []
            });
        }
    }

    public write(token?: T) {
        const seen: ParseState[] = [];
        const remaining = this.derivations.slice();

        while (remaining.length >= 1) {
            const derivation = remaining.pop()!;

            const sequence = this.grammar.rules[derivation.nonTerminal][derivation.sequence];

            if (derivation.term >= sequence.length) {
                if (derivation.parent) {
                    remaining.push({
                        nonTerminal: derivation.parent.nonTerminal,
                        sequence: derivation.parent.sequence,
                        term: derivation.parent.term + 1,
                        token: derivation.parent.token,
                        parent: derivation.parent.parent,
                        children: [...derivation.parent.children, derivation]
                    });
                }
            } else {
                const term = sequence[derivation.term];
                switch (term.type) {
                    case "terminal": {
                        if (term.terminal === token) {
                            seen.push({
                                nonTerminal: derivation.nonTerminal,
                                sequence: derivation.sequence,
                                term: derivation.term + 1,
                                token: derivation.token,
                                parent: derivation.parent,
                                children: derivation.children
                            });
                        }
                        break;
                    }
                    case "non-terminal": {
                        const rules = this.grammar.rules[term.name];
                        for (let i = 0; i < rules.length; i++) {
                            remaining.push({
                                nonTerminal: term.name,
                                sequence: i,
                                term: 0,
                                token: this.token,
                                parent: derivation,
                                children: []
                            });
                        }
                        break;
                    }
                }
            }
        }

        console.log("==========");
        console.log(token);
        console.log("----------");
        for (const derivation of this.derivations) {
            console.log(stringifyParseState(derivation, this.grammar));
        }
        console.log("----------");
        for (const derivation of seen) {
            console.log(stringifyParseState(derivation, this.grammar));
        }

        this.derivations = seen;
        this.token += 1;
    }

    public getDerivations() {
        return this.derivations;
    }
}

const parser = new Parser(grammarNonRecursive);
parser.write("a");
parser.write("+");
parser.write("a");
// parser.write();

fs.writeFileSync(__dirname + "/parser-grammar.txt", stringifyGrammar(grammar));
fs.writeFileSync(__dirname + "/parser-grammar-non-recursive.txt", stringifyGrammar(grammarNonRecursive));
fs.writeFileSync(__dirname + "/parser-states.dot", toDot(parser.getDerivations(), grammarNonRecursive));
