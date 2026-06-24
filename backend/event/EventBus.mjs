export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  once(eventName, handler) {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  off(eventName, handler) {
    const bucket = this.listeners.get(eventName);
    if (!bucket) return;
    bucket.delete(handler);
    if (bucket.size === 0) this.listeners.delete(eventName);
  }

  emit(eventName, payload) {
    const bucket = this.listeners.get(eventName);
    if (!bucket) return;
    for (const handler of [...bucket]) handler(payload);
  }

  clear() {
    this.listeners.clear();
  }
}
