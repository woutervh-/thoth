import { Accepter } from './accepter';
import { Builder } from './builder';
import { Deterministic } from './deterministic';
import { Dot } from './dot';
import { Minimizer } from './minimizer';
import { Numberfier } from './numberfier';
import { Runner } from './runner';

const letterI = Builder.terminal('i');
const letterF = Builder.terminal('f');
const letterS = Builder.terminal('s');
const semicolon = Builder.terminal(';');
const ifBuilder = Builder.sequence([letterI, letterF]);
const identifierBuilder = Builder.alternatives([letterI, letterF, letterS]).oneOrMore();

interface Token<T> {
    name: string;
    accepter: Accepter<T>;
}

class Lexer<T> {
    private position: number = 0;
    private longestAcceptingLength: number = 0;
    private longestAcceptingToken: Token<T> | null = null;
    private tokens: Token<T>[];

    constructor(tokens: Token<T>[]) {
        this.tokens = tokens;
    }

    public write(input: T) {
        for (const token of this.tokens) {
            token.accepter.consume(input);
        }
        
        const acceptingToken = this.tokens.find((token) => token.accepter.canConsume(input));
        if (acceptingToken) {

            this.longestAcceptingLength += 1;
            this.longestAcceptingToken = acceptingToken;
        } else {
            if (this.longestAcceptingToken === null) {
                throw new Error('No token can accept this input.');
            }
            console.log(`${this.longestAcceptingToken.name} at ${this.position} for ${this.longestAcceptingLength}`);
            this.position += this.longestAcceptingLength;
            this.longestAcceptingLength = 0;
            this.longestAcceptingToken = null;
            for (const runner of this.accepters.values()) {
                runner.reset();
            }
        }
    }
}



const tokens = [ifBuilder, identifierBuilder, semicolon]
    .map<Token<number, string>>((builder) => {
        return {
            fsm: builder.build(),
            name
        };
    });

const lexer = new Lexer(tokens);


const fsm = Numberfier.convertStateToNumbers(Minimizer.removeDeadlocks(Minimizer.minimize(Deterministic.deterministic(tokensBuilder.build()))));
const dot = new Dot((state: number) => `S${state}`, (action: string) => action).toDot(fsm);
console.log(dot);
