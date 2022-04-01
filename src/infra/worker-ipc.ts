import { EventEmitter } from 'events';


class WorkerWithEvents extends EventEmitter {
    inner: Worker

    constructor(uri: string) {
        super();
        this.inner = new Worker(uri);
        this.inner.addEventListener('message', ({data: {type, ev}}) =>
            type && this.emit(type, ev));
    }

    postMessage(message: any, opt?: Transferable[] | StructuredSerializeOptions) {
        this.inner.postMessage(message, <any>opt);
    }
}


export { WorkerWithEvents }