import { Accepter } from './accepter';

export class CharacterAccepter implements Accepter<string> {
    public name: string;

    private character: string;

    constructor(character: string) {
        this.name = character;
        this.character = character;
    }

    public isGreedy() {
        return false;
    }

    public accept(character: string) {
        return character === this.character;
    }
}
