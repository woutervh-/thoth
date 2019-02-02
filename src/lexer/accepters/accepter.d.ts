export interface Accepter<T> {
    name: string;

    accept(input: T): boolean;
}
