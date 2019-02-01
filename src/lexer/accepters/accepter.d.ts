export interface Accepter<T> {
    name: string;

    isGreedy(): boolean;

    accept(input: T): boolean;
}
