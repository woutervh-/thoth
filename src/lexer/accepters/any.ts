import { Accepter } from './accepter';

export class Any implements Accepter<string> {
    public accept() {
        return true;
    }
}
