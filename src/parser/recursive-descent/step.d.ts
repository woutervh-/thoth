export interface Reference {
    type: 'reference';
    name: string;
}

export interface Empty {
    type: 'empty';
}

export interface Terminal<T> {
    type: 'terminal';
    input: T;
}

export interface Sequence<T> {
    type: 'sequence';
    steps: Step<T>[];
}

export interface Repeat<T> {
    type: 'repeat';
    min: number;
    max: number;
    step: Step<T>;
}

export interface Alternatives<T> {
    type: 'alternatives';
    steps: Step<T>[];
}

export type Step<T> = Terminal<T> | Sequence<T> | Alternatives<T> | Repeat<T> | Reference | Empty;
