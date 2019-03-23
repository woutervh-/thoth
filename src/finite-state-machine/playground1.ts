import { Accepter } from './accepter';
import { Builder } from './builder';
// import { Deterministic } from './deterministic';
// import { Dot } from './dot';
// import { Minimizer } from './minimizer';
// import { Numberfier } from './numberfier';
import { FiniteStateMachineAccepter } from './finite-state-machine-accepter';

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

interface TokenMatch<T> {
    token: Token<T>;
    position: number;
    inputs: T[];
}

class Lexer<T> {
    private position: number = 0;
    private currentTokenContent: T[] = [];
    private longestTokenLength: number = 0;
    private longestAcceptingToken: Token<T> | null = null;
    private tokenStates: Map<Token<T>, 'pending' | 'rejected'>;
    private tokens: Token<T>[];

    constructor(tokens: Token<T>[]) {
        this.tokenStates = new Map();
        this.tokens = tokens;
        for (const token of tokens) {
            this.tokenStates.set(token, 'pending');
        }
    }

    public write(input: T | undefined) {
        let pendingTokens = this.tokens.filter((token) => this.tokenStates.get(token) === 'pending');
        if (input !== undefined) {
            this.currentTokenContent.push(input);
            if (pendingTokens.length >= 1) {
                for (const token of pendingTokens) {
                    if (token.accepter.isValidNextInput(input)) {
                        token.accepter.consumeNextInput(input);
                    } else {
                        this.tokenStates.set(token, 'rejected');
                    }
                }
                pendingTokens = this.tokens.filter((token) => this.tokenStates.get(token) === 'pending');
                const acceptingToken = pendingTokens.find((token) => token.accepter.isAccepting());
                if (acceptingToken !== undefined) {
                    this.longestTokenLength = this.currentTokenContent.length;
                    this.longestAcceptingToken = acceptingToken;
                }
            }
        }
        if (input === undefined || pendingTokens.length <= 0) {
            if (this.longestAcceptingToken === null) {
                throw new Error('Invalid input.');
            }
            // Reset and log the longest accepting token.
            // Rewind rejected input.
            const match: TokenMatch<T> = {
                inputs: this.currentTokenContent.slice(0, this.longestTokenLength),
                position: this.position,
                token: this.longestAcceptingToken
            };
            console.log(JSON.stringify(match));
            const remainingInput = this.currentTokenContent.slice(this.longestTokenLength);
            this.position += this.longestTokenLength;
            this.currentTokenContent = [];
            this.longestTokenLength = 0;
            this.longestAcceptingToken = null;
            for (const token of this.tokens) {
                token.accepter.reset();
                this.tokenStates.set(token, 'pending');
            }
            // Rewind and replay the remaining input that was used for lookahead.
            for (const input of remainingInput) {
                this.write(input);
            }
        }
    }
}

const ifToken: Token<string> = {
    accepter: new FiniteStateMachineAccepter(ifBuilder.build()),
    name: 'IF'
};

const semicolonToken: Token<string> = {
    accepter: new FiniteStateMachineAccepter(semicolon.build()),
    name: 'SEMICOLON'
};

const identifierToken: Token<string> = {
    accepter: new FiniteStateMachineAccepter(identifierBuilder.build()),
    name: 'IDENTIFIER'
};

const lexer = new Lexer([ifToken, identifierToken, semicolonToken]);

lexer.write('i');
lexer.write(';');
lexer.write('i');
lexer.write('f');
lexer.write(';');
lexer.write('i');
lexer.write('f');
lexer.write('i');
lexer.write(';');
lexer.write(undefined);

// const fsm = Numberfier.convertStateToNumbers(Minimizer.removeDeadlocks(Minimizer.minimize(Deterministic.deterministic(tokensBuilder.build()))));
// const dot = new Dot((state: number) => `S${state}`, (action: string) => action).toDot(fsm);
// console.log(dot);
