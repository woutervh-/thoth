import { Accepter } from './accepters/accepter';
import { Token } from './token';

export class Lexer<T> {
    private position: number = 0;
    private currentTokenContent: T[] = [];
    private longestTokenLength: number = 0;
    private longestAcceptingAccepter: Accepter<T> | null = null;
    private accepterStateMap: Map<Accepter<T>, 'pending' | 'rejected'>;
    private accepters: Accepter<T>[];

    constructor(accepters: Accepter<T>[]) {
        this.accepterStateMap = new Map();
        this.accepters = accepters;
        for (const accepter of accepters) {
            this.accepterStateMap.set(accepter, 'pending');
        }
    }

    public write(input: T | undefined) {
        let pendingAccepters = this.accepters.filter((accepter) => this.accepterStateMap.get(accepter) === 'pending');
        if (input !== undefined) {
            this.currentTokenContent.push(input);
            if (pendingAccepters.length >= 1) {
                for (const accepter of pendingAccepters) {
                    if (accepter.isValidNextInput(input)) {
                        accepter.consumeNextInput(input);
                    } else {
                        this.accepterStateMap.set(accepter, 'rejected');
                    }
                }
                pendingAccepters = this.accepters.filter((accepter) => this.accepterStateMap.get(accepter) === 'pending');
                const acceptingAccepter = pendingAccepters.find((accepter) => accepter.isAccepting());
                if (acceptingAccepter !== undefined) {
                    this.longestTokenLength = this.currentTokenContent.length;
                    this.longestAcceptingAccepter = acceptingAccepter;
                }
            }
        }
        if (input === undefined || pendingAccepters.length <= 0) {
            if (this.longestAcceptingAccepter === null) {
                throw new Error('Invalid input.');
            }
            // Reset and log the longest accepting token.
            // Rewind rejected input.
            const match: Token<T> = {
                accepter: this.longestAcceptingAccepter,
                inputs: this.currentTokenContent.slice(0, this.longestTokenLength),
                position: this.position
            };
            console.log(JSON.stringify(match));
            const remainingInput = this.currentTokenContent.slice(this.longestTokenLength);
            this.position += this.longestTokenLength;
            this.currentTokenContent = [];
            this.longestTokenLength = 0;
            this.longestAcceptingAccepter = null;
            for (const accepter of this.accepters) {
                accepter.reset();
                this.accepterStateMap.set(accepter, 'pending');
            }
            // Rewind and replay the remaining input that was used for lookahead.
            for (const input of remainingInput) {
                this.write(input);
            }
        }
    }
}
