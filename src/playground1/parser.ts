import * as fs from "fs";

// -----------------------------------------------------------

interface NonTerminal {
    nonTerminal: string;
}

interface Terminal<T> {
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
                        ? sequence.map((term) => "nonTerminal" in term ? term.nonTerminal : term.terminal).join(" ")
                        : "ε"
                    )
                    .join(" | ")}`
                : `${nonTerminal} → ∅`;
        })
        .join("\n");
}

function sequenceStartsWithNonTerminal<T>(sequence: Term<T>[], nonTerminal: string) {
    if (sequence.length >= 1) {
        const firstTerm = sequence[0];
        return "nonTerminal" in firstTerm && firstTerm.nonTerminal === nonTerminal;
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
            newSequencesB.push([...rest, { nonTerminal: newNonTerminal }]);
        } else {
            newSequencesA.push(sequence);
            newSequencesA.push([...sequence, { nonTerminal: newNonTerminal }]);
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
            [{ nonTerminal: "E" }, { terminal: "+" }, { nonTerminal: "E" }],
            [{ terminal: "a" }]
        ]
    }
};

const grammarNonRecursive = removeAllLeftRecursion(grammar);

fs.writeFileSync(__dirname + "/grammar.txt", stringifyGrammar(grammar));
fs.writeFileSync(__dirname + "/grammar-non-recursive.txt", stringifyGrammar(grammarNonRecursive));
