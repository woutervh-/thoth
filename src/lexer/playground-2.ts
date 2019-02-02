import { Accepter } from './accepters/accepter';
import { CharacterAccepter } from './accepters/character-accepter';
import { Builder } from './finite-state-machine/builder';
import { Converter } from './finite-state-machine/converter';
import { Deterministic } from './finite-state-machine/deterministic';
import { Minimizer } from './finite-state-machine/minimizer';

const underscoreAccepter: Accepter<string> = new CharacterAccepter('_');

console.log(JSON.stringify(
    Minimizer.minimize(Converter.convertStateToNumbers(Deterministic.deterministic(
        Builder.terminal(underscoreAccepter).followedBy(Builder.terminal(underscoreAccepter).zeroOrMore()).build()
    )))
));
