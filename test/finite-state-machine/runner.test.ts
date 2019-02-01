import * as assert from 'assert';
import { FiniteStateMachine } from '../../src/finite-state-machine/finite-state-machine';
import { Runner } from '../../src/finite-state-machine/runner';

describe('Runner', () => {
    describe('Runner.run', () => {
        describe('regular expression /^0+1/', () => {
            const fsm: FiniteStateMachine<string, number> = {
                acceptingStates: ['c'],
                initialState: 'a',
                transitions: [
                    ['a', 0, 'b'],
                    ['b', 0, 'b'], ['b', 1, 'c']
                ]
            };
            const runner = new Runner(fsm);

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
