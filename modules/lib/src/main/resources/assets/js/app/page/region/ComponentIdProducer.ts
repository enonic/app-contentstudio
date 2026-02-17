export class ComponentIdProducer {

    private componentCounter: number = 0;

    next(): number {
        return ++this.componentCounter;
    }
}
