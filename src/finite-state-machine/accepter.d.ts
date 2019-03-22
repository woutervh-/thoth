export interface Accepter<T> {
    consume(input: T): void;
    isAccepting(): boolean;
}
