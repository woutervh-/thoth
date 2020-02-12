export interface NonTerminal {
    type: 'non-terminal';
    name: string;
}

export interface Terminal<T> {
    type: 'terminal';
    terminal: T;
}

export type Term<T> = NonTerminal | Terminal<T>;

export interface Grammar<T> {
    [Key: string]: Term<T>[][];
}
