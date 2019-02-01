import { Accepter } from './accepter';

export class DigitAccepter implements Accepter<string> {
    public isGreedy = true;

    public accept(character: string) {
        return character === '0'
            || character === '1'
            || character === '2'
            || character === '3'
            || character === '4'
            || character === '5'
            || character === '6'
            || character === '7'
            || character === '8'
            || character === '9';
    }
}
