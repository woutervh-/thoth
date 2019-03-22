export interface Accepter<T> {
    consumeNextInput(input: T): void;
    isValidNextInput(input: T): boolean;
    getNextInputAlternatives(): T[];
    isAccepting(): boolean;
    reset(): void;
}
