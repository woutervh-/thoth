import * as assert from 'assert';
import { SingleString } from '../../../src/lexer/accepters/single-string';

describe('SingleString', () => {
    describe('SingleString.accept', () => {
        describe('single character "a"', () => {
            const accepter = new SingleString('a');

            it('it accepts the string "a"', () => {
                assert.deepStrictEqual(accepter.accept('a'), true);
            });

            it('rejects another string', () => {
                assert.deepStrictEqual(accepter.accept(''), false);
                assert.deepStrictEqual(accepter.accept('b'), false);
                assert.deepStrictEqual(accepter.accept('c'), false);
                assert.deepStrictEqual(accepter.accept('aa'), false);
            });
        });
    });
});
