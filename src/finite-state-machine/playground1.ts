import { Writable } from 'stream';
import { Builder } from './builder';
import { Deterministic } from './deterministic';
import { Dot } from './dot';
import { FiniteStateMachine } from './finite-state-machine';
import { Minimizer } from './minimizer';
import { Numberfier } from './numberfier';

const letterI = Builder.terminal('i');
const letterF = Builder.terminal('f');
const letterS = Builder.terminal('s');
const semicolon = Builder.terminal(';');
const ifBuilder = Builder.sequence([letterI, letterF]);
const identifierBuilder = Builder.alternatives([letterI, letterF, letterS]).oneOrMore();

class Lexer<S, T> {
    private tokens: FiniteStateMachine<S, T>[];

    constructor(tokens: FiniteStateMachine<S, T>[]) {
        this.tokens = tokens;
    }

    public write(input: T) {

    }
}

const tokens = [ifBuilder, identifierBuilder, semicolon].map((builder) => Builder.terminal(builder.build()));
const tokensBuilder = Builder.alternatives(tokens).zeroOrMore();

const fsm = Numberfier.convertStateToNumbers(Minimizer.removeDeadlocks(Minimizer.minimize(Deterministic.deterministic(tokensBuilder.build()))));
const dot = new Dot((state: number) => `S${state}`, (action: string) => action).toDot(fsm);
console.log(dot);
