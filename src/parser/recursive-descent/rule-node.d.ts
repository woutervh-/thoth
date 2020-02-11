export interface RuleNode {
    nonTerminal: string;
    sequenceIndex: number;
    termIndex: number;
    childNodes: RuleNode[] | null;
}
