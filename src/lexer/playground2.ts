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
const equalsAccepter: Accepter<string> = new CharacterAccepter('=');
const underscoreAccepter: Accepter<string> = new CharacterAccepter('_');
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

const optionalWhitespace = Builder
    .terminal(whitespaceAccepter)
    .zeroOrMore();

const statement = identifier
    .followedBy(optionalWhitespace)
    .followedBy(Builder.terminal(equalsAccepter));

const fsm = statement
    .zeroOrMore()
    .build();

const accepterMachine = Minimizer.minimize(Converter.convertStateToNumbers(Deterministic.deterministic(fsm)));

const graphvizLines = [
    'digraph finite_state_machine {',
    'rankdir=LR;',
    'size="8,5"',
    `node [style = filled] S${accepterMachine.initialState};`,
    'node [style = solid];',
    `node [shape = doublecircle]; ${accepterMachine.acceptingStates.map((state) => `S${state}`).join(' ')};`,
    'node [shape = circle];',
    ...accepterMachine.transitions.map((transition) => `S${transition[0]} -> S${transition[2]} [ label = "${transition[1].name}" ];`),
    '}'
];
console.log(graphvizLines.join('\n'));
console.log(JSON.stringify(accepterMachine));
