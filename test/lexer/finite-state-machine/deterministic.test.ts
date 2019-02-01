import * as assert from 'assert';
import { Deterministic } from '../../../src/lexer/finite-state-machine/deterministic';
import { FiniteStateMachine } from '../../../src/lexer/finite-state-machine/finite-state-machine';

describe('Deterministic', () => {
    describe('Deterministic.deterministic', () => {
        it('produces an equivalent deterministic state machine #1', () => {
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
            const expected: FiniteStateMachine<string[], number> = {
                acceptingStates: [
                    ['d', 'e'],
                    ['e'],
                    ['a', 'b', 'c', 'd', 'e'],
                    ['d', 'e', 'b'],
                    ['c', 'e']
                ],
                initialState: ['a'],
                transitions: [
                    [['a'], 0, ['a', 'b', 'c', 'd', 'e']],
                    [['a'], 1, ['d', 'e']],
                    [['d', 'e'], 0, ['e']],
                    [['a', 'b', 'c', 'd', 'e'], 0, ['a', 'b', 'c', 'd', 'e']],
                    [['a', 'b', 'c', 'd', 'e'], 1, ['d', 'e', 'b']],
                    [['d', 'e', 'b'], 0, ['c', 'e']],
                    [['d', 'e', 'b'], 1, ['e']],
                    [['c', 'e'], 1, ['b']],
                    [['b'], 0, ['c']],
                    [['b'], 1, ['e']],
                    [['c'], 1, ['b']]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces an equivalent deterministic state machine #2', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [0, 1],
                initialState: 0,
                transitions: [
                    [0, 'a', 1], [0, 'a', 2],
                    [1, 'a', 1], [1, 'a', 2],
                    [2, 'b', 1], [2, 'b', 3],
                    [3, 'a', 1], [3, 'a', 2]
                ]
            };
            const actual = Deterministic.deterministic(fsm1);
            const expected: FiniteStateMachine<number[], string> = {
                acceptingStates: [
                    [0],
                    [1, 2],
                    [1, 3]
                ],
                initialState: [0],
                transitions: [
                    [[0], 'a', [1, 2]],
                    [[1, 2], 'a', [1, 2]], [[1, 2], 'b', [1, 3]],
                    [[1, 3], 'a', [1, 2]]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });
});
