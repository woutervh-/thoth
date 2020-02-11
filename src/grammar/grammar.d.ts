export interface NonTerminal {
    type: 'non-terminal';
    name: string;
}

export interface Terminal<T> {
    type: 'terminal';
    terminal: T;
}

export type Term<T> = NonTerminal | Terminal<T>;

interface Alternative<T> {
    associativity: 'left' | 'right' | undefined;
    precedence: number | undefined;
    sequence: Term<T>[];
}

export interface Grammar<T> {
    [Key: string]: Term<T>[][];
}
