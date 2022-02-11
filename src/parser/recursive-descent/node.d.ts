export interface Span {
    start: number;
    end: number;
}

export interface Empty {
    type: "empty";
    span: Span;
}

export interface TerminalNode<T> {
    type: "terminal";
    terminal: T;
    span: Span;
}

export interface PreRuleNode<T> {
    type: "rule";
    name: string;
    span: Span;
    children: PreNode<T>[];
}

export interface SequenceNode<T> {
    type: "sequence";
    span: Span;
    children: PreNode<T>[];
}

export type PreNode<T> = TerminalNode<T> | PreRuleNode<T> | SequenceNode<T> | Empty;

export interface PostRuleNode<T> {
    type: "rule";
    name: string;
    span: Span;
    children: PostNode<T>[];
}

export type PostNode<T> = TerminalNode<T> | PreRuleNode<T> | Empty;
