import { Accepter } from './accepter';

export class WhitespaceAccepter implements Accepter<string> {
    public name = 'whitespace';

    public isGreedy() {
        return true;
    }

    public accept(character: string) {
        return character === ' '
            || character === '\n'
            || character === '\r'
            || character === '\t';
    }
}
