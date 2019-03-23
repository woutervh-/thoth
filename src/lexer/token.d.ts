import { Accepter } from './accepters/accepter';

interface Token<T> {
    accepter: Accepter<T>;
    position: number;
    inputs: T[];
}
