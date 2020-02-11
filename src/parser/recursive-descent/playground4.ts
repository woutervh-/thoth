// import { Deterministic } from '../grammar/deterministic';
import { Grammar, Term } from '../../grammar/grammar';
import { Minimizer } from '../../grammar/minimizer';
import { Printer } from '../../grammar/printer';
import { Recursion } from '../../grammar/recursion';

interface Rule {
    sequence: Term<string>[];
    termIndex: number;
}

function printRuleSet(ruleSet: Rule[]) {
    for (const rule of ruleSet) {
        Printer.printSequence(rule.sequence, rule.termIndex);
    }
}

let grammar: Grammar<string> = {
    E: [
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '^' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '*' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'non-terminal', name: 'E' }, { type: 'terminal', terminal: '-' }, { type: 'non-terminal', name: 'E' }],
        [{ type: 'terminal', terminal: 'a' }]
    ]
};

console.log('--- original ---');
Printer.printGrammar(grammar);

grammar = Recursion.removeAllLeftRecursion(grammar);
console.log('--- removed left-recursion ---');
Printer.printGrammar(grammar);

// grammar = Deterministic.leftFactor(grammar);
// console.log('--- left-factored ---');
// Printer.printGrammar(grammar);

grammar = Minimizer.removeEmptyRules(grammar);
console.log('--- remove empty non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.substituteSimpleNonTerminals(grammar);
console.log('--- substitute simple non-terminals ---');
Printer.printGrammar(grammar);

grammar = Minimizer.removeUnreachables(grammar, ['E']);
console.log('--- remove unreachables ---');
Printer.printGrammar(grammar);

function removeTerminatedRules(ruleSet: Rule[]): Rule[] {
    const nextRuleSet: Rule[] = [];
    for (const rule of ruleSet) {
        if (rule.termIndex < rule.sequence.length) {
            nextRuleSet.push(rule);
        }
    }
    return nextRuleSet;
}

function expandTerminalRules(ruleSet: Rule[], token: string): Rule[] {
    const nextRuleSet: Rule[] = [];
    for (const rule of ruleSet) {
        const term = rule.sequence[rule.termIndex];
        if (term.type === 'terminal') {
            if (term.terminal === token) {
                nextRuleSet.push({ sequence: rule.sequence, termIndex: rule.termIndex + 1 });
            }
        }
    }
    return nextRuleSet;
}

function expandNonTerminalRules(ruleSet: Rule[]): Rule[] {
    const terminalRules: Rule[] = [];
    const remainingRules: Rule[] = ruleSet.slice();
    while (remainingRules.length >= 1) {
        const rule = remainingRules.pop()!;
        if (rule.termIndex >= rule.sequence.length) {
            continue;
        }
        const term = rule.sequence[rule.termIndex];
        if (term.type === 'terminal') {
            terminalRules.push(rule);
            continue;
        }
        const sequences = grammar[term.name];
        const rules = sequences.map((sequence): Rule => {
            return {
                sequence: [...sequence, ...rule.sequence.slice(rule.termIndex + 1)],
                termIndex: 0
            };
        });
        remainingRules.push(...rules);
    }
    return terminalRules;
}

function areRulesEqual(ruleA: Rule, ruleB: Rule): boolean {
    if (ruleA.termIndex !== ruleB.termIndex) {
        return false;
    }
    if (ruleA.sequence.length !== ruleB.sequence.length) {
        return false;
    }
    for (let i = 0; i < ruleA.sequence.length; i++) {
        const termA = ruleA.sequence[i];
        const termB = ruleB.sequence[i];
        if (termA.type === 'terminal' && termB.type === 'terminal' && termA.terminal === termB.terminal) {
            continue;
        }
        if (termA.type === 'non-terminal' && termB.type === 'non-terminal' && termA.name === termB.name) {
            continue;
        }
        return false;
    }
    return true;
}

function removeDuplicateRules(ruleSet: Rule[]): Rule[] {
    const nextRuleSet: Rule[] = [];
    for (const ruleA of ruleSet) {
        if (!nextRuleSet.some((ruleB) => areRulesEqual(ruleA, ruleB))) {
            nextRuleSet.push(ruleA);
        }
    }
    return nextRuleSet;
}

function nextRuleSet(ruleSet: Rule[], token: string): Rule[] {
    let nextRuleSet: Rule[] = ruleSet.slice();
    nextRuleSet = removeTerminatedRules(nextRuleSet);
    nextRuleSet = expandTerminalRules(nextRuleSet, token);
    nextRuleSet = expandNonTerminalRules(nextRuleSet);
    nextRuleSet = removeDuplicateRules(nextRuleSet);
    return nextRuleSet;
}

const startSymbol = 'E';
const initialRuleSet = grammar[startSymbol].map((sequence): Rule => {
    return {
        sequence,
        termIndex: 0
    };
});
let currentRuleSet = expandNonTerminalRules(initialRuleSet);

console.log('--- first rule set ---');
printRuleSet(currentRuleSet);

console.log('--- second rule set ---');
currentRuleSet = nextRuleSet(currentRuleSet, 'a');
printRuleSet(currentRuleSet);

console.log('--- third rule set ---');
currentRuleSet = nextRuleSet(currentRuleSet, '*');
printRuleSet(currentRuleSet);

console.log('--- fourth rule set ---');
currentRuleSet = nextRuleSet(currentRuleSet, 'a');
printRuleSet(currentRuleSet);

console.log('--- fifth rule set ---');
currentRuleSet = nextRuleSet(currentRuleSet, '-');
printRuleSet(currentRuleSet);
