import { Accepter } from './accepter';

export class SingleString implements Accepter<string> {
    private text: string;

    constructor(text: string) {
        this.text = text;
    }

    public accept(input: string) {
        return input === this.text;
    }
}
