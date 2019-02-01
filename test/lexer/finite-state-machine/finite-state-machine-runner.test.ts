import * as assert from 'assert';
import { FiniteStateMachine } from '../../../src/lexer/finite-state-machine/finite-state-machine';
import { FiniteStateMachineRunner } from '../../../src/lexer/finite-state-machine/finite-state-machine-runner';

describe('FiniteStateMachineRunner', () => {
    describe('FiniteStateMachineRunner.run', () => {
        describe('empty expression', () => {
            const fsm: FiniteStateMachine<string, number> = {
                acceptingStates: ['a'],
                initialState: 'a',
                transitions: []
            };
            const runner = new FiniteStateMachineRunner(fsm);

            it('accepts immediately regardless of the sequence', () => {
                assert.deepStrictEqual(runner.run([]), 0);
                assert.deepStrictEqual(runner.run([0]), 0);
                assert.deepStrictEqual(runner.run([1]), 0);
                assert.deepStrictEqual(runner.run([0, 1]), 0);
                assert.deepStrictEqual(runner.run([0, 1, 2]), 0);
            });
        });

        describe('regular expression /^0+1/', () => {
            const fsm: FiniteStateMachine<string, number> = {
                acceptingStates: ['c'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'b'],
                    ['b', 0, 'b'], ['b', 1, 'c']
                ]
            };
            const runner = new FiniteStateMachineRunner(fsm);

            it('rejects invalid sequences', () => {
                assert.deepStrictEqual(runner.run([]), null);
                assert.deepStrictEqual(runner.run([0]), null);
                assert.deepStrictEqual(runner.run([0, 0]), null);
                assert.deepStrictEqual(runner.run([0, 0, 0]), null);
                assert.deepStrictEqual(runner.run([1]), null);
                assert.deepStrictEqual(runner.run([1, 1]), null);
                assert.deepStrictEqual(runner.run([1, 1, 1]), null);
                assert.deepStrictEqual(runner.run([2]), null);
                assert.deepStrictEqual(runner.run([2, 2]), null);
                assert.deepStrictEqual(runner.run([2, 2, 2]), null);
                assert.deepStrictEqual(runner.run([0, 2]), null);
                assert.deepStrictEqual(runner.run([0, 2, 1]), null);
                assert.deepStrictEqual(runner.run([0, 2, 1, 0]), null);
                assert.deepStrictEqual(runner.run([0, 2, 1, 0, 1]), null);
                assert.deepStrictEqual(runner.run([1, 2]), null);
                assert.deepStrictEqual(runner.run([1, 2, 0]), null);
                assert.deepStrictEqual(runner.run([1, 2, 0, 1]), null);
            });

            it('accepts valid sequences', () => {
                assert.deepStrictEqual(runner.run([0, 1]), 2);
                assert.deepStrictEqual(runner.run([0, 1, 1]), 2);
                assert.deepStrictEqual(runner.run([0, 1, 1, 1]), 2);
                assert.deepStrictEqual(runner.run([0, 0, 1]), 3);
                assert.deepStrictEqual(runner.run([0, 0, 1, 1]), 3);
                assert.deepStrictEqual(runner.run([0, 0, 1, 1, 1]), 3);
                assert.deepStrictEqual(runner.run([0, 0, 0, 1]), 4);
                assert.deepStrictEqual(runner.run([0, 0, 0, 1, 1]), 4);
                assert.deepStrictEqual(runner.run([0, 0, 0, 1, 1, 1]), 4);
                assert.deepStrictEqual(runner.run([0, 1, 2]), 2);
                assert.deepStrictEqual(runner.run([0, 1, 2, 3]), 2);
                assert.deepStrictEqual(runner.run([0, 1, 2, 3, 4]), 2);
            });
        });
    });
});
