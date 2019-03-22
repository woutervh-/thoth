import { AccepterRunner } from './accepter-runner';
import { Accepter } from './accepters/accepter';
import { CharacterAccepter } from './accepters/character-accepter';
import { DigitAccepter } from './accepters/digit-accepter';
import { LatinAlphabetAccepter } from './accepters/latin-alphabet-accepter';
import { WhitespaceAccepter } from './accepters/whitespace-accepter';
import { Builder } from './finite-state-machine/builder';
import { Deterministic } from './finite-state-machine/deterministic';
import { Dot } from './finite-state-machine/dot';
import { Minimizer } from './finite-state-machine/minimizer';
import { Numberfier } from './finite-state-machine/numberfier';

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

const lexer = Builder
    .alternatives([
        whitespace,
        integer,
        identifier,
        Builder.terminal(plusAccepter),
        Builder.terminal(equalsAccepter),
        Builder.terminal(semiColonAccepter)
    ])
    .zeroOrMore()
    .build();

const accepterMachine = Numberfier.convertStateToNumbers(Minimizer.minimize(Deterministic.deterministic(lexer)));
const input = 'foo = 123 + 456;';
const accepterRunner = new AccepterRunner(accepterMachine);
const run = accepterRunner.run([...input]);
const info = run.map((accepted) => [accepted.start, accepted.count, accepted.accepter.name]);

console.log(new Dot((state: number) => `S${state}`, (action: Accepter<string>) => action.name).toDot(accepterMachine));
console.log(JSON.stringify(accepterMachine));
console.log(input);
console.log(JSON.stringify(info, null, 2));
