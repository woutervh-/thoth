export interface Accepter<T> {
    accept(input: T): boolean;
}
