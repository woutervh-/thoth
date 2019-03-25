export interface Fragment<T> {
    name: string;
    accepts(input: T): boolean;
}
