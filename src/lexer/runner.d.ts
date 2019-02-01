export interface Runner<T> {
    run(input: T[]): number | null;
}
