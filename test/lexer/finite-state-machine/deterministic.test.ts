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
    });
});
