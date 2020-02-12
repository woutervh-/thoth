export interface Node {
    nonTerminal: string;
    sequenceIndex: number;
    termIndex: number;
    tokenIndex: number;
}

function areNodesEqual(nodeA: Node, nodeB: Node) {
    return nodeA.nonTerminal === nodeB.nonTerminal
        && nodeA.sequenceIndex === nodeB.sequenceIndex
        && nodeA.termIndex === nodeB.termIndex
        && nodeA.tokenIndex === nodeB.tokenIndex;
}

export class DAG {
    public readonly nodes: Node[] = [];
    private children: Map<Node, Node[]> = new Map();
    private parents: Map<Node, Node[]> = new Map();

    public getChildren(node: Node): Node[] {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        if (this.children.has(node)) {
            return this.children.get(node)!;
        } else {
            return [];
        }
    }

    public getParents(node: Node): Node[] {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        if (this.parents.has(node)) {
            return this.parents.get(node)!;
        } else {
            return [];
        }
    }

    public addParent(child: Node, parent: Node) {
        if (!this.nodes.includes(child)) {
            throw new Error('Child node does not exist.');
        }
        if (!this.nodes.includes(parent)) {
            throw new Error('Parent node does not exist.');
        }
        if (!this.children.has(parent)) {
            this.children.set(parent, []);
        }
        if (!this.children.get(parent)!.includes(child)) {
            this.children.get(parent)!.push(child);
        }
        if (!this.parents.has(child)) {
            this.parents.set(child, []);
        }
        if (!this.parents.get(child)!.includes(parent)) {
            this.parents.get(child)!.push(parent);
        }
    }

    public addChild(parent: Node, child: Node) {
        this.addParent(child, parent);
    }

    public removeParent(child: Node, parent: Node) {
        if (!this.nodes.includes(child)) {
            throw new Error('Child node does not exist.');
        }
        if (!this.nodes.includes(parent)) {
            throw new Error('Parent node does not exist.');
        }
        if (!this.children.has(parent)) {
            throw new Error('Parent has no children.');
        }
        if (!this.parents.has(child)) {
            throw new Error('Child has no parents.');
        }

        const children = this.children.get(parent)!;
        const childIndex = children.indexOf(child);
        if (childIndex >= 0) {
            children.splice(childIndex, 1);
        }
        if (children.length <= 0) {
            this.children.delete(parent);
        }

        const parents = this.parents.get(child)!;
        const parentIndex = parents.indexOf(parent);
        if (parentIndex >= 0) {
            parents.splice(parentIndex, 1);
        }
        if (parents.length <= 0) {
            this.parents.delete(child);
        }
    }

    public removeChild(parent: Node, child: Node) {
        this.removeParent(child, parent);
    }

    public removeNode(node: Node) {
        if (this.parents.has(node)) {
            throw new Error('Node still has parents.');
        }
        if (this.children.has(node)) {
            throw new Error('Node still has children.');
        }
        const index = this.nodes.indexOf(node);
        if (index <= -1) {
            throw new Error('Node does not exist.');
        }
        this.nodes.splice(index, 1);
    }

    public findNode(node: Node): Node | null {
        const found = this.nodes.find((nodeB) => areNodesEqual(node, nodeB));
        if (found) {
            return found;
        } else {
            return null;
        }
    }

    public addNode(node: Node) {
        const found = this.findNode(node);
        if (!found) {
            this.nodes.push(node);
        }
    }
}
