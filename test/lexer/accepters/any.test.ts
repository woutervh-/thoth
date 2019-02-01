import * as assert from 'assert';
import { Any } from '../../../src/lexer/accepters/any';

describe('Any', () => {
    describe('Any.accept', () => {
        it('accepts any string', () => {
            const accepter = new Any();
            assert.deepStrictEqual(accepter.accept(), 0);
        });
    });
});
