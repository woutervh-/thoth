import { AccepterRunner } from './accepter-runner';
import { Accepter } from './accepters/accepter';
import { CharacterAccepter } from './accepters/character-accepter';
import { DigitAccepter } from './accepters/digit-accepter';
import { LatinAlphabetAccepter } from './accepters/latin-alphabet-accepter';
import { WhitespaceAccepter } from './accepters/whitespace-accepter';
import { Builder } from './finite-state-machine/builder';

const digitAccepter: Accepter<string> = new DigitAccepter();
const whitespaceAccepter: Accepter<string> = new WhitespaceAccepter();
const plusAccepter: Accepter<string> = new CharacterAccepter('+');
const equalsAccepter: Accepter<string> = new CharacterAccepter('=');
const underscoreAccepter: Accepter<string> = new CharacterAccepter('_');
const semiColonAccepter: Accepter<string> = new CharacterAccepter(';');
const letterAccepter: Accepter<string> = new LatinAlphabetAccepter();

const identifier = Builder.sequence([
    Builder.alternatives([
        Builder.terminal(underscoreAccepter),
        Builder.terminal(letterAccepter)
    ]),
    Builder
        .alternatives([
            Builder.terminal(underscoreAccepter),
            Builder.terminal(letterAccepter),
            Builder.terminal(digitAccepter)
        ])
        .zeroOrMore()
]);
const integer = Builder.terminal(digitAccepter).oneOrMore();
const whitespace = Builder.terminal(whitespaceAccepter).oneOrMore();
const assignment = Builder.terminal(equalsAccepter);
const plus = Builder.terminal(plusAccepter);
const semiColon = Builder.terminal(semiColonAccepter);

/* tslint:disable:max-classes-per-file no-console */

class SequenceRule<T> {
    public readonly rules: Rule<T>[];

    constructor(rules: Rule<T>[]) {
        this.rules = rules;
    }
}

class AlternativesRule<T> {
    public readonly rules: Rule<T>[];

    constructor(rules: Rule<T>[]) {
        this.rules = rules;
    }
}

class TerminalRule<T> {
    public readonly builder: Builder<T>;

    constructor(builder: Builder<T>) {
        this.builder = builder;
    }
}

class NonTerminalRule {
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }
}

type Rule<T> = SequenceRule<T> | AlternativesRule<T> | TerminalRule<T> | NonTerminalRule;

class RuleBuilder {
    public static sequence<T>(rules: Rule<T>[]) {
        return new SequenceRule(rules);
    }

    public static alternatives<T>(rules: Rule<T>[]) {
        return new AlternativesRule(rules);
    }

    public static terminal<T>(builder: Builder<T>) {
        return new TerminalRule(builder);
    }

    public static nonTerminal(name: string) {
        return new NonTerminalRule(name);
    }
}

class Grammar<T> {
    private ruleMap: Map<string, Rule<T>> = new Map();

    public addNonTerminal(name: string, rule: Rule<T>) {
        if (this.ruleMap.has(name)) {
            throw new Error(`Non-terminal ${name} already exists.`);
        }
        this.ruleMap.set(name, rule);
        return this;
    }

    public buildLexer(name: string): Builder<T> {
        const rule = this.ruleMap.get(name);
        if (rule === undefined) {
            throw new Error(`Non-terminal ${name} does not exist.`);
        }
        return this.lexerFromRule(rule);
    }

    private lexerFromRule(rule: Rule<T>): Builder<T> {
        if (rule instanceof SequenceRule) {
            return Builder.sequence(rule.rules.map((rule) => this.lexerFromRule(rule)));
        } else if (rule instanceof AlternativesRule) {
            return Builder.alternatives(rule.rules.map((rule) => this.lexerFromRule(rule)));
        } else if (rule instanceof TerminalRule) {
            return rule.builder;
        } else {
            return this.buildLexer(rule.name);
        }
    }
}

new Grammar<Accepter<string>>()
    .addNonTerminal(
        'expression',
        RuleBuilder.alternatives([
            RuleBuilder.terminal(identifier),
            RuleBuilder.sequence([
                RuleBuilder.nonTerminal('expression'),
                RuleBuilder.terminal(plus),
                RuleBuilder.nonTerminal('expression')
            ])
        ])
    );

class Parser {
    public identifier(input: string[]) {
        const runner = new AccepterRunner(identifier.build());
        if (runner.run(input) !== null) {

        }
    }

    public expression() {
        this.identifier();
    }

    public program() {
        this.expression();
    }
}
