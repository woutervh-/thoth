import { Accepter } from './accepter';

export class LatinAlphabetAccepter implements Accepter<string> {
    public name = 'latin alphabet';

    public accept(character: string) {
        if (character.length >= 1) {
            return 65 <= character.codePointAt(0)! && character.codePointAt(0)! <= 90
                || 97 <= character.codePointAt(0)! && character.codePointAt(0)! <= 122;
        } else {
            return false;
        }
    }
}
