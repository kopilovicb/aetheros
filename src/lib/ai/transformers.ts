interface AIGenerateOptions {
  prompt: string;
  fallback: string;
}

interface AIResult {
  text: string;
  usedAI: boolean;
}

interface PendingRequest {
  resolve: (text: string) => void;
}

interface AIWorkerMessage {
  type?: string;
  id?: string;
  text?: string | null;
}

class AetherAI {
  private worker: Worker | null = null;
  private isReady = false;
  private isLoading = false;
  private pendingRequests: Map<string, PendingRequest> = new Map();

  initialize(): void {
    if (this.worker || this.isLoading) return;
    if (typeof window === "undefined") return;

    this.isLoading = true;
    this.worker = new Worker("/ai-worker.js", { type: "module" });
    this.worker.onmessage = (event: MessageEvent<AIWorkerMessage>) => {
      const { type, id, text } = event.data;

      if (type === "ready") {
        this.isReady = true;
        this.isLoading = false;
      }

      if (type === "error") {
        this.isReady = false;
        this.isLoading = false;
      }

      if (type === "result" && id) {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          pending.resolve(text || "");
          this.pendingRequests.delete(id);
        }
      }
    };
    this.worker.postMessage({ type: "load" });
  }

  async generate(options: AIGenerateOptions): Promise<AIResult> {
    if (!this.isReady || !this.worker) {
      return { text: options.fallback, usedAI: false };
    }

    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, {
        resolve: (text: string) => {
          resolve({ text: text || options.fallback, usedAI: Boolean(text) });
        },
      });
      this.worker?.postMessage({ type: "generate", prompt: options.prompt, id });
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve({ text: options.fallback, usedAI: false });
        }
      }, 10000);
    });
  }

  get ready(): boolean {
    return this.isReady;
  }

  get loading(): boolean {
    return this.isLoading;
  }
}

export const aetherAI = new AetherAI();
