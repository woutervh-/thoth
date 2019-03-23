import * as stream from 'stream';
import { Accepter } from './accepters/accepter';
import { ErrorToken, Matchedtoken } from './token';

/**
 * Object mode transform stream which takes input `T` and outputs tokens based on the accepters.
 * The longest accepted slice of the inputs will determine which accepter is used to create a token.
 * In case of a tie, the first accepter will be used.
 */
export class Lexer<T> extends stream.Transform {
    private position: number = 0;
    private currentTokenContent: T[] = [];
    private longestTokenLength: number = 0;
    private longestAcceptingAccepter: Accepter<T> | null = null;
    private accepterStateMap: Map<Accepter<T>, 'pending' | 'rejected'>;
    private accepters: Accepter<T>[];

    constructor(accepters: Accepter<T>[]) {
        super({ readableObjectMode: true, writableObjectMode: true });
        this.accepterStateMap = new Map();
        this.accepters = accepters;
        for (const accepter of accepters) {
            this.accepterStateMap.set(accepter, 'pending');
        }
    }

    public _transform(chunk: unknown, encoding: string, callback: stream.TransformCallback) {
        this.consume(chunk as T);
        callback();
    }

    public _flush(callback: stream.TransformCallback) {
        this.consume(undefined);
        callback();
    }

    private reset() {
        this.position += this.longestTokenLength;
        this.currentTokenContent = [];
        this.longestTokenLength = 0;
        this.longestAcceptingAccepter = null;
        for (const accepter of this.accepters) {
            accepter.reset();
            this.accepterStateMap.set(accepter, 'pending');
        }
    }

    private consume(input: T | undefined) {
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
                const errorToken: ErrorToken<T> = {
                    input,
                    position: this.position,
                    type: 'error'
                };
                // Skip unmatched input until this point.
                this.longestTokenLength = this.currentTokenContent.length;
                this.push(errorToken);
                this.reset();
            } else {
                // Reset and rewind rejected input.
                const matchedToken: Matchedtoken<T> = {
                    accepter: this.longestAcceptingAccepter,
                    inputs: this.currentTokenContent.slice(0, this.longestTokenLength),
                    position: this.position,
                    type: 'matched'
                };
                const remainingInput = this.currentTokenContent.slice(this.longestTokenLength);
                this.push(matchedToken);
                this.reset();
                // Rewind and replay the remaining input that was used for lookahead.
                for (const input of remainingInput) {
                    this.consume(input);
                }
            }
        }
    }
}
