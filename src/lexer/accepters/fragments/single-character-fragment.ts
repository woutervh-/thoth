import { Fragment } from './fragment';

export class SingleCharacterFragment implements Fragment<string> {
    public name: string;
    private character: string;

    constructor(character: string, name?: string) {
        this.name = name === undefined ? character : name;
        this.character = character;
    }

    public accepts(input: string) {
        return input === this.character;
    }
}
