export interface Accepter<T> {
    name: string;
    consumeNextInput(input: T): void;
    isValidNextInput(input: T): boolean;
    isAccepting(): boolean;
    reset(): void;
}
