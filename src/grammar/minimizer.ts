import { Grammar, Term } from './grammar';

export class Minimizer {
    public static substituteSimpleNonTerminals<T>(grammar: Grammar<T>) {
        const newGrammar = { ...grammar };
        const nonTerminals = Object.keys(newGrammar);
        for (const nonTerminal of nonTerminals) {
            const oldSequences = newGrammar[nonTerminal];
            const newSequences: Term<T>[][] = [];
            for (const oldSequence of oldSequences) {
                const newSequence: Term<T>[] = [];
                for (const term of oldSequence) {
                    if (term.type === 'non-terminal' && newGrammar[term.name].length === 1) {
                        newSequence.push(...newGrammar[term.name][0]);
                    } else {
                        newSequence.push(term);
                    }
                }
                newSequences.push(newSequence);
            }
            newGrammar[nonTerminal] = newSequences;
        }
        return newGrammar;
    }

    public static removeEmptyRules<T>(grammar: Grammar<T>): Grammar<T> {
        const newGrammar = { ...grammar };
        let hasChanged = true;
        while (hasChanged) {
            hasChanged = false;
            const nonTerminals = Object.keys(newGrammar);
            for (const nonTerminal of nonTerminals) {
                const oldSequences = newGrammar[nonTerminal];
                const newSequences: Term<T>[][] = [];
                for (const oldSequence of oldSequences) {
                    if (oldSequence.every((term) => term.type !== 'non-terminal' || term.name in newGrammar)) {
                        newSequences.push(oldSequence);
                    } else {
                        hasChanged = true;
                    }
                }
                if (newSequences.length >= 1) {
                    newGrammar[nonTerminal] = newSequences;
                } else {
                    delete newGrammar[nonTerminal];
                    hasChanged = true;
                }
                if (oldSequences.length !== newSequences.length) {
                    hasChanged = true;
                }
            }
        }
        return newGrammar;
    }

    public static removeUnreachables<T>(grammar: Grammar<T>, startingNonTerminals: string[]): Grammar<T> {
        const reachableNonTerminals: Set<string> = new Set();
        const queue: string[] = [...startingNonTerminals];
        while (queue.length >= 1) {
            const nonTerminal = queue.pop()!;
            reachableNonTerminals.add(nonTerminal);
            for (const sequence of grammar[nonTerminal]) {
                for (const term of sequence) {
                    if (term.type === 'non-terminal' && !reachableNonTerminals.has(term.name)) {
                        queue.push(term.name);
                    }
                }
            }
        }
        const newGrammar: Grammar<T> = {};
        for (const nonTerminal of Object.keys(grammar)) {
            if (reachableNonTerminals.has(nonTerminal)) {
                newGrammar[nonTerminal] = grammar[nonTerminal];
            }
        }
        return newGrammar;
    }

    // public static removeDegenerateAlternatives<T>(grammar: Grammar<T>): Grammar<T> {
    // TODO: Given a non-terminal, deduplicate its sequences that are identical.
    // }

    // public static reduceCommonSequences<T>(grammar: Grammar<T>): Grammar<T> {
    // TODO: Given all sequences in the grammar, extract those that are repeated into new non-terminals.
    // }
}
