import { AccepterRunner } from './accepter-runner';
import { Accepter } from './accepters/accepter';
import { CharacterAccepter } from './accepters/character-accepter';
import { DigitAccepter } from './accepters/digit-accepter';
import { LatinAlphabetAccepter } from './accepters/latin-alphabet-accepter';
import { WhitespaceAccepter } from './accepters/whitespace-accepter';
import { Builder } from './finite-state-machine/builder';
import { Converter } from './finite-state-machine/converter';
import { Deterministic } from './finite-state-machine/deterministic';
import { Minimizer } from './finite-state-machine/minimizer';

const digitAccepter: Accepter<string> = new DigitAccepter();
const whitespaceAccepter: Accepter<string> = new WhitespaceAccepter();
const plusAccepter: Accepter<string> = new CharacterAccepter('+');
const equalsAccepter: Accepter<string> = new CharacterAccepter('=');
const underscoreAccepter: Accepter<string> = new CharacterAccepter('_');
const semiColonAccepter: Accepter<string> = new CharacterAccepter(';');
const letterAccepter: Accepter<string> = new LatinAlphabetAccepter();

const identifier = Builder
    .alternatives([
        Builder.terminal(underscoreAccepter),
        Builder.terminal(letterAccepter)
    ])
    .followedBy(
        Builder
            .alternatives([
                Builder.terminal(underscoreAccepter),
                Builder.terminal(letterAccepter),
                Builder.terminal(digitAccepter)
            ])
            .zeroOrMore()
    );

const integer = Builder.terminal(digitAccepter).oneOrMore();

const optionalWhitespace = Builder
    .terminal(whitespaceAccepter)
    .zeroOrMore();

const statement = identifier
    .followedBy(optionalWhitespace)
    .followedBy(Builder.terminal(equalsAccepter))
    .followedBy(optionalWhitespace)
    .followedBy(integer)
    .followedBy(optionalWhitespace)
    .followedBy(Builder.terminal(plusAccepter))
    .followedBy(optionalWhitespace)
    .followedBy(integer)
    .followedBy(optionalWhitespace)
    .followedBy(Builder.terminal(semiColonAccepter));

const fsm = statement
    .zeroOrMore()
    .build();

const accepterMachine = Minimizer.minimize(Converter.convertStateToNumbers(Deterministic.deterministic(fsm)));
const input = 'foo = 123 + 456;';
const accepterRunner = new AccepterRunner(accepterMachine);
const run = accepterRunner.run([...input]);
const info = run.map((accepted) => [accepted.start, accepted.count, accepted.accepter.name]);

console.log(JSON.stringify(accepterMachine));
console.log(input);
console.log(JSON.stringify(info, null, 2));
