import { Node } from './node';

function areNodesEqual(nodeA: Node, nodeB: Node) {
    return nodeA.nonTerminal === nodeB.nonTerminal
        && nodeA.sequenceIndex === nodeB.sequenceIndex
        && nodeA.termIndex === nodeB.termIndex
        && nodeA.startIndex === nodeB.startIndex
        && nodeA.endIndex === nodeB.endIndex;
}

export class DAG {
    public readonly nodes: Node[] = [];
    private children: Map<Node, Node[]> = new Map();
    private parents: Map<Node, Node[]> = new Map();

    public getRootNodes(): Node[] {
        return this.nodes.filter((node) => !this.parents.has(node));
    }

    public getLeafNodes(): Node[] {
        return this.nodes.filter((node) => !this.children.has(node));
    }

    public hasChildren(node: Node) {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        return this.children.has(node);
    }

    public hasParents(node: Node) {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        return this.parents.has(node);
    }

    public getChildren(node: Node): Node[] | null {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        if (!this.children.has(node)) {
            return null;
        }
        return this.children.get(node)!.slice();
    }

    public getParents(node: Node): Node[] | null {
        if (!this.nodes.includes(node)) {
            throw new Error('Node does not exist.');
        }
        if (!this.parents.has(node)) {
            return null;
        }
        return this.parents.get(node)!.slice();
    }

    public setParent(child: Node, parent: Node) {
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

    public setChild(parent: Node, child: Node) {
        this.setParent(child, parent);
    }

    public unsetParent(child: Node, parent: Node) {
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

    public unsetChild(parent: Node, child: Node) {
        this.unsetParent(child, parent);
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

    public destroyNode(node: Node) {
        const index = this.nodes.indexOf(node);
        if (index <= -1) {
            throw new Error('Node does not exist.');
        }
        const parents = this.getParents(node);
        if (parents) {
            for (const parent of parents) {
                this.unsetParent(node, parent);
            }
        }
        const children = this.getChildren(node);
        if (children) {
            for (const child of children) {
                this.unsetParent(child, node);
            }
        }
        this.nodes.splice(index, 1);
    }

    public hasNode(node: Node) {
        return this.nodes.includes(node);
    }

    public findNode(node: Node): Node | null {
        const found = this.nodes.find((nodeB) => areNodesEqual(node, nodeB));
        if (found) {
            return found;
        } else {
            return null;
        }
    }

    private addNode(node: Node) {
        const found = this.findNode(node);
        if (!found) {
            this.nodes.push(node);
        }
    }

    public addOrFind(node: Node): Node {
        const found = this.findNode(node);
        if (found) {
            return found;
        } else {
            this.addNode(node);
            return node;
        }
    }
}
