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
    private currentTokenContent: T[] = [];
    private longestTokenLength: number = 0;
    private longestAcceptingToken: Token<T> | null = null;
    private tokens: Token<T>[];
    private tokenStates: Map<Token<T>, 'pending' | 'rejected'>;

    constructor(tokens: Token<T>[]) {
        this.tokens = tokens;
        this.tokenStates = new Map();
        for (const token of tokens) {
            this.tokenStates.set(token, 'pending');
        }
    }

    public write(input: T) {
        this.currentTokenContent.push(input);
        const pendingTokens = this.tokens.filter((token) => this.tokenStates.get(token) === 'pending');
        if (pendingTokens.length >= 1) {
            for (const token of pendingTokens) {
                if (token.accepter.isValidNextInput(input)) {
                    token.accepter.consumeNextInput(input);
                } else {
                    this.tokenStates.set(token, 'rejected');
                }
            }
            const acceptingToken = pendingTokens.find((token) => token.accepter.isAccepting());
            if (acceptingToken !== undefined) {
                this.longestTokenLength = this.currentTokenContent.length;
                this.longestAcceptingToken = acceptingToken;
            }
        } else {
            if (this.longestAcceptingToken === null) {
                throw new Error('Invalid input.');
            }
            // Reset and log the longest accepting token.
            // Rewind rejected input.
            console.log(`${this.longestAcceptingToken.name} accepted ${this.longestTokenLength} inputs at ${this.position}`);
            if (this.longestTokenLength < this.currentTokenContent.length) {
                // We did some lookahead.
                // We should rewind and replay the remaining tokens.
                const remainingTokens = this.currentTokenContent.slice(this.longestTokenLength);
            }
            this.position += this.longestTokenLength;
            this.currentTokenContent = [];
            this.longestTokenLength = 0;
            this.longestAcceptingToken = null;
            for (const token of this.tokens) {
                this.tokenStates.set(token, 'pending');
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
