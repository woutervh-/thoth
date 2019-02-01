export interface Accepter<T> {
    isGreedy: boolean;

    accept(input: T): boolean;
}
