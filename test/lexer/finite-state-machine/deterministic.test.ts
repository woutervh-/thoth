import * as assert from 'assert';
import { FiniteStateMachine } from '../../../src/lexer/finite-state-machine/finite-state-machine';
import { Deterministic } from '../../../src/lexer/finite-state-machine/deterministic';

describe('Deterministic', () => {
    describe('Deterministic.deterministic', () => {
        it('produces an equivalent deterministic state machine', () => {
            const fsm1: FiniteStateMachine<string, number> = {
                acceptingStates: ['e'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'a'], ['a', 0, 'b'], ['a', 0, 'c'], ['a', 0, 'd'], ['a', 0, 'e'],
                    ['a', 1, 'd'], ['a', 1, 'e'],
                    ['b', 0, 'c'],
                    ['b', 1, 'e'],
                    ['c', 1, 'b'],
                    ['d', 0, 'e']
                ]
            };
            const actual = Deterministic.deterministic(fsm1);
            const expected: FiniteStateMachine<Set<string>, number> = {
                acceptingStates: [
                    new Set(['a', 'b', 'c', 'd', 'e']),
                    new Set(['d', 'e']),
                    new Set(['b', 'd', 'e']),
                    new Set(['e']),
                    new Set(['c', 'e'])
                ],
                initialState: new Set(['a']),
                transitions: [
                    [new Set(['a']), 0, new Set(['a', 'b', 'c', 'd', 'e'])],
                    [new Set(['a']), 1, new Set(['d', 'e'])],
                    [new Set(['a', 'b', 'c', 'd', 'e']), 0, new Set(['a', 'b', 'c', 'd', 'e'])],
                    [new Set(['a', 'b', 'c', 'd', 'e']), 1, new Set(['b', 'd', 'e'])],
                    [new Set(['d', 'e']), 0, new Set(['e'])],
                    [new Set(['b', 'd', 'e']), 0, new Set(['c', 'e'])],
                    [new Set(['b', 'd', 'e']), 1, new Set(['e'])],
                    [new Set(['c', 'e']), 1, new Set(['b'])],
                    [new Set(['b']), 0, new Set(['c'])],
                    [new Set(['b']), 1, new Set(['e'])],
                    [new Set(['c']), 1, new Set(['b'])]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });
});
