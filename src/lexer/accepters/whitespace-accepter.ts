import { Accepter } from './accepter';

export class WhitespaceAccepter implements Accepter<string> {
    public name = 'whitespace';

    public accept(character: string) {
        return character === ' '
            || character === '\n'
            || character === '\r'
            || character === '\t';
    }
}
