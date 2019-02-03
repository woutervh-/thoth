/* tslint:disable:max-classes-per-file no-console */

interface Terminal {
    accept(input: string): boolean;
}

class PlusTerminal implements Terminal {
    public accept(input: string) {
        return input === '+';
    }
}

class StarTerminal implements Terminal {
    public accept(input: string) {
        return input === '*';
    }
}

class IdentifierTerminal implements Terminal {
    public accept(input: string) {
        return /[_a-z][_a-z0-9]*/.test(input);
    }
}

class Grammar {
    private symbols: Set<string>;
    private terminals: Set<Terminal>;
    private productions: [string, ];
    private start: string;

    constructor(symbols: Set<string>, terminals: Set<Terminal>) {
        this.symbols = symbols;
        this.terminals = terminals;
    }
}

const grammar = new Grammar(
    new Set(['E']),
    new Set([
        new PlusTerminal(),
        new StarTerminal(),
        new IdentifierTerminal()
    ])
);
