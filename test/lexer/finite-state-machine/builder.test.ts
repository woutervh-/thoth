import * as assert from 'assert';
import { Builder } from '../../../src/lexer/finite-state-machine/builder';
import { FiniteStateMachine } from '../../../src/lexer/finite-state-machine/finite-state-machine';

describe('Builder', () => {
    describe('Builder.empty', () => {
        it('builds an empty finite state machine', () => {
            const actual = Builder.empty<string>().build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [0],
                initialState: 0,
                transitions: []
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.terminal', () => {
        it('builds a finite state machine which accepts the single action', () => {
            const actual = Builder.terminal('a').build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1],
                initialState: 0,
                transitions: [[0, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.many', () => {
        it('builds a finite state machine which accepts one or more repetitions of the underlying finite state machine', () => {
            const actual = Builder.many(Builder.terminal('a')).build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1],
                initialState: 0,
                transitions: [[0, 'a', 1], [1, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.oneOrMore', () => {
        it('builds a finite state machine which accepts one or more repetitions of the underlying finite state machine', () => {
            const actual = Builder.terminal('a').oneOrMore().build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1],
                initialState: 0,
                transitions: [[0, 'a', 1], [1, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.maybe', () => {
        it('builds a finite state machine which accepts immediately or after a single execution of the underlying finite state machine', () => {
            const actual = Builder.maybe(Builder.terminal('a')).build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 2],
                initialState: 2,
                transitions: [[0, 'a', 1], [2, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.optional', () => {
        it('builds a finite state machine which accepts immediately or after a single execution of the underlying finite state machine', () => {
            const actual = Builder.terminal('a').optional().build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 2],
                initialState: 2,
                transitions: [[0, 'a', 1], [2, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.any', () => {
        it('builds a finite state machine which accepts zero or more repetitions of the underlying finite state machine', () => {
            const actual = Builder.any(Builder.terminal('a')).build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 2],
                initialState: 2,
                transitions: [[0, 'a', 1], [1, 'a', 1], [2, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.zeroOrMore', () => {
        it('builds a finite state machine which accepts zero or more repetitions of the underlying finite state machine', () => {
            const actual = Builder.terminal('a').zeroOrMore().build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 2],
                initialState: 2,
                transitions: [[0, 'a', 1], [1, 'a', 1], [2, 'a', 1]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.sequence', () => {
        it('builds a finite state machine which accepts the underlying state machines in succession', () => {
            const actual = Builder
                .sequence([
                    Builder.terminal('a'),
                    Builder.terminal('b')
                ])
                .build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [3],
                initialState: 0,
                transitions: [[0, 'a', 1], [2, 'b', 3], [1, 'b', 3]]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('correctly handles initial states which are accepting states', () => {
            const actual = Builder
                .sequence([
                    Builder.terminal('a').optional(),
                    Builder.terminal('b').optional()
                ])
                .build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [4, 5, 1, 2],
                initialState: 2,
                transitions: [[0, 'a', 1], [2, 'a', 1], [3, 'b', 4], [5, 'b', 4], [1, 'b', 4], [2, 'b', 4]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.followedBy', () => {
        it('builds a finite state machine which accepts the underlying state machines in succession', () => {
            const actual = Builder.terminal('a').followedBy(Builder.terminal('b')).build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [3],
                initialState: 0,
                transitions: [[0, 'a', 1], [2, 'b', 3], [1, 'b', 3]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.repeat', () => {
        it('builds a finite state machine which accepts the underlying state machine for the given amount of times in succession', () => {
            const actual = Builder.terminal('a')
                .repeat(2)
                .build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [3],
                initialState: 0,
                transitions: [[0, 'a', 1], [2, 'a', 3], [1, 'a', 3]]
            };
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('Builder.alternatives', () => {
        it('builds a finite state machine which accepts either of the underlying state machines', () => {
            const actual = Builder
                .alternatives([
                    Builder.terminal('a'),
                    Builder.terminal('b')
                ])
                .build();
            const expected: FiniteStateMachine<number, string> = {
                acceptingStates: [1, 3],
                initialState: 4,
                transitions: [[4, 'a', 1], [4, 'b', 3]]
            };
            assert.deepStrictEqual(actual, expected);
        });

        it('correctly handles initial states which are accepting states', () => {
            // TODO
            throw new Error('Missing implementation.');
        });
    });
});
