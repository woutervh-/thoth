interface NonTerminal {
    type: 'non-terminal';
    name: string;
}

interface Terminal<T> {
    type: 'terminal';
    terminal: T;
}

type Term<T> = NonTerminal | Terminal<T>;

export interface Grammar<T> {
    [Key: string]: Term<T>[][];
}
