export interface Accepter<T> {
    name: string;
    consumeNextInput(input: T): void;
    isValidNextInput(input: T): boolean;
    getNextInputAlternatives(): T[];
    isAccepting(): boolean;
    reset(): void;
}
