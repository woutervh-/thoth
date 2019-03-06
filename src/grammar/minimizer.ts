import { Grammar, Term } from './grammar';

export class Minimizer {
    public static removeEmptyRules<T>(grammar: Grammar<T>) {
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

    public static trimUnreachables<T>(grammar: Grammar<T>, startingNonTerminal: string) {
        const newGrammar: Grammar<T> = {};
        const queue: string[] = [startingNonTerminal];
        while (queue.length >= 1) {
            const nonTerminal = queue.pop()!;
            newGrammar[nonTerminal] = grammar[nonTerminal];
            for (const sequence of grammar[nonTerminal]) {
                for (const term of sequence) {
                    if (term.type === 'non-terminal' && !(term.name in newGrammar)) {
                        queue.push(term.name);
                    }
                }
            }
        }
        return newGrammar;
    }
}
