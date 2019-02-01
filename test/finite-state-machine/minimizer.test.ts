import * as assert from 'assert';
import { FiniteStateMachine } from '../../src/finite-state-machine/finite-state-machine';
import { Minimizer } from '../../src/finite-state-machine/minimizer';

describe('Minimizer', () => {
    describe('Minimizer.minimize', () => {
        it('produces minimal state machines #1', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [0, 5],
                initialState: 1,
                transitions: [
                    [0, 'a', 0], [0, 'b', 0],
                    [1, 'a', 2], [1, 'b', 5],
                    [2, 'a', 3], [2, 'b', 0],
                    [3, 'a', 3], [3, 'b', 4],
                    [4, 'a', 3], [4, 'b', 0],
                    [5, 'a', 6], [5, 'b', 0],
                    [6, 'a', 0], [6, 'b', 5]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [5, 0],
                initialState: 1,
                transitions: [
                    [0, 'a', 0], [0, 'b', 0],
                    [1, 'a', 2], [1, 'b', 5],
                    [2, 'a', 3], [2, 'b', 0],
                    [3, 'a', 3], [3, 'b', 2],
                    [5, 'a', 6], [5, 'b', 0],
                    [6, 'a', 0], [6, 'b', 5]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #2', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [0, 2],
                initialState: 0,
                transitions: [
                    [0, 'T', 0], [0, 'H', 1],
                    [1, 'T', 1], [1, 'H', 2],
                    [2, 'T', 2], [2, 'H', 3],
                    [3, 'T', 3], [3, 'H', 0]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [0],
                initialState: 0,
                transitions: [
                    [0, 'T', 0], [0, 'H', 1],
                    [1, 'T', 1], [1, 'H', 0]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #3', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [2, 4],
                initialState: 1,
                transitions: [
                    [1, 'a', 2], [1, 'b', 4],
                    [2, 'a', 3], [2, 'b', 6],
                    [3, 'a', 2], [3, 'b', 4],
                    [4, 'a', 6], [4, 'b', 5],
                    [5, 'a', 2], [5, 'b', 4],
                    [6, 'a', 6], [6, 'b', 6]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [4, 2],
                initialState: 1,
                transitions: [
                    [1, 'a', 2], [1, 'b', 4],
                    [2, 'a', 1], [2, 'b', 6],
                    [4, 'a', 6], [4, 'b', 1],
                    [6, 'a', 6], [6, 'b', 6]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #4', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [2, 4],
                initialState: 0,
                transitions: [
                    [0, 'a', 1], [0, 'b', 4], [0, 'c', 3],
                    [1, 'a', 2],
                    [2, 'b', 2],
                    [3, 'c', 2],
                    [4, 'b', 2]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [2],
                initialState: 0,
                transitions: [
                    [0, 'a', 1], [0, 'b', 2], [0, 'c', 3],
                    [1, 'a', 2],
                    [2, 'b', 2],
                    [3, 'c', 2]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #5', () => {
            const fsm1: FiniteStateMachine<string, number> = {
                acceptingStates: ['c', 'd', 'e'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'b'], ['a', 1, 'c'],
                    ['b', 0, 'a'], ['b', 1, 'd'],
                    ['c', 0, 'e'], ['c', 1, 'f'],
                    ['d', 0, 'e'], ['d', 1, 'f'],
                    ['e', 0, 'e'], ['e', 1, 'f'],
                    ['f', 0, 'f'], ['f', 1, 'f']
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<string, number> = {
                acceptingStates: ['c'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'a'], ['a', 1, 'c'],
                    ['c', 0, 'c'], ['c', 1, 'f'],
                    ['f', 0, 'f'], ['f', 1, 'f']
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #6', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 4],
                initialState: 5,
                transitions: [
                    [0, 'a', 5],
                    [1, 'a', 0],
                    [2, 'a', 1],
                    [3, 'a', 2],
                    [4, 'a', 3],
                    [5, 'a', 4]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [4],
                initialState: 5,
                transitions: [
                    [3, 'a', 5],
                    [4, 'a', 3],
                    [5, 'a', 4]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #7', () => {
            const fsm1: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 2],
                initialState: 0,
                transitions: [
                    [0, 'a', 2], [0, 'b', 1],
                    [1, 'a', 1], [1, 'b', 2],
                    [2, 'a', 2], [2, 'b', 2]
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1],
                initialState: 0,
                transitions: [
                    [0, 'a', 1], [0, 'b', 1],
                    [1, 'a', 1], [1, 'b', 1]
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #8', () => {
            const fsm1: FiniteStateMachine<string, number> = {
                acceptingStates: ['f', 'g'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'h'], ['a', 1, 'b'],
                    ['b', 0, 'h'], ['b', 1, 'a'],
                    ['c', 0, 'e'], ['c', 1, 'f'],
                    ['d', 0, 'e'], ['d', 1, 'f'],
                    ['e', 0, 'f'], ['e', 1, 'g'],
                    ['f', 0, 'f'], ['f', 1, 'f'],
                    ['g', 0, 'g'], ['g', 1, 'f'],
                    ['h', 0, 'c'], ['h', 1, 'c']
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<string, number> = {
                acceptingStates: ['f'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'h'], ['a', 1, 'a'],
                    ['c', 0, 'e'], ['c', 1, 'f'],
                    ['e', 0, 'f'], ['e', 1, 'f'],
                    ['f', 0, 'f'], ['f', 1, 'f'],
                    ['h', 0, 'c'], ['h', 1, 'c']
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('produces minimal state machines #9', () => {
            const fsm1: FiniteStateMachine<string, number> = {
                acceptingStates: ['f', 'g', 'h', 'i'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'b'],
                    ['b', 0, 'c'], ['b', 1, 'f'],
                    ['c', 0, 'd'], ['c', 1, 'g'],
                    ['d', 0, 'e'], ['d', 1, 'h'],
                    ['e', 0, 'e'], ['e', 1, 'i']
                ]
            };
            const actual = Minimizer.minimize(fsm1);
            const expected: FiniteStateMachine<string, number> = {
                acceptingStates: ['f'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'b'],
                    ['b', 0, 'b'], ['b', 1, 'f']
                ]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });
});
