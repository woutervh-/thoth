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
    lines.push("node [style=filled];");

    const nameMap = new Map<ParseState, string>();
    const queue = derivations.slice();
    while (queue.length >= 1) {
        const derivation = queue.pop()!;
        if (nameMap.has(derivation)) {
            continue;
        }
        const relatives = derivation.parents;
        for (const relative of relatives) {
            queue.push(relative);
        }
        nameMap.set(derivation, `t${nameMap.size}`);
    }

    const nodes: string[] = [];
    const edges: string[] = [];
    for (const [derivation, name] of nameMap) {
        for (const parent of derivation.parents) {
            edges.push(`${nameMap.get(parent)!} -> ${name};`);
        }
        const label = stringifyParseState(derivation, grammar).replace(/•/g, "&bull;");
        let color: string;
        if (derivation.term >= grammar.rules[derivation.nonTerminal][derivation.sequence].length) {
            color = "grey";
        } else {
            color = "white";
        }
        nodes.push(`${name} [fillcolor="${color}", label="${derivation.nonTerminal} &rarr; ${label} (${derivation.start}-${derivation.end})"];`);
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

class EarleyParser<T> {
    public constructor(private grammar: Grammar<T>) { }

    public write(input?: T): void {
        //
    }
}

fs.writeFileSync(__dirname + "/parser-grammar.txt", stringifyGrammar(grammar));
fs.writeFileSync(__dirname + "/parser-grammar-non-recursive.txt", stringifyGrammar(grammarNonRecursive));
