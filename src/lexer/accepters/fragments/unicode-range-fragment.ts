import { Fragment } from './fragment';

export class UnicodeRangeFragment implements Fragment<string> {
    public name: string;
    private infimum: number;
    private supremum: number;

    constructor(infimum: string | number, supremum: string | number, name?: string) {
        if (typeof infimum === 'string') {
            infimum = infimum.charCodeAt(0);
        }
        if (typeof supremum === 'string') {
            supremum = supremum.charCodeAt(0);
        }
        this.name = name === undefined ? `0x${infimum.toString(16)}-0x${supremum.toString(16)}` : name;
        this.infimum = infimum;
        this.supremum = supremum;
    }

    public accepts(input: string) {
        const charCode = input.charCodeAt(0);
        return this.infimum <= charCode && charCode <= this.supremum;
    }
}
