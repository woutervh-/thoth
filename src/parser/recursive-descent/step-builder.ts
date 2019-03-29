import { Alternatives, Empty, Reference, Repeat, Sequence, Step, Terminal } from './step';

export class StepBuilder {
    public static alternatives<T>(steps: Step<T>[]): Alternatives<T> {
        return { type: 'alternatives', steps };
    }

    public static empty(): Empty {
        return { type: 'empty' };
    }

    public static reference(name: string): Reference {
        return { type: 'reference', name };
    }

    public static repeat<T>(step: Step<T>, min?: number, max?: number): Repeat<T> {
        return { type: 'repeat', min: min === undefined ? 0 : min, max: max === undefined ? Number.POSITIVE_INFINITY : max, step };
    }

    public static sequence<T>(steps: Step<T>[]): Sequence<T> {
        return { type: 'sequence', steps };
    }

    public static terminal<T>(input: T): Terminal<T> {
        return { type: 'terminal', input };
    }
}
