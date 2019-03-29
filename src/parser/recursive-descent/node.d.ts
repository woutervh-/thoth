export interface Span {
    start: number;
    end: number;
}

export interface Empty {
    type: 'empty';
    span: Span;
}

export interface TerminalNode<T> {
    type: 'terminal';
    terminal: T;
    span: Span;
}

export interface RuleNode<T> {
    type: 'rule';
    name: string;
    span: Span;
    children: Node<T>[];
}

export interface SequenceNode<T> {
    type: 'sequence';
    span: Span;
    children: Node<T>[];
}

export type Node<T> = TerminalNode<T> | RuleNode<T> | SequenceNode<T> | Empty;
