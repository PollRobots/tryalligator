
export type Worker<TArgs, TResult> = (args: TArgs) => TResult;

export class WorkCache<TArgs, TResult> {
  private readonly worker_: Worker<TArgs, TResult>;
  private readonly results_ = new Map<string, TResult>();
  private readonly seen_ = new Set<string>();
  private hit_: number;
  private miss_: number;
  private discard_: number;

  constructor(worker: Worker<TArgs, TResult>) {
    this.worker_ = worker;
    this.hit_ = 0;
    this.miss_ = 0;
    this.discard_ = 0;
  }

  compute(key: string, args: TArgs): TResult {
    let existing = this.results_.get(key);
    if (!existing) {
      existing = this.worker_(args);
      this.results_.set(key, existing);
      this.miss_++;
    } else {
      this.hit_++;
    }
    this.seen_.add(key);
    return existing;
  }

  clear() {
    this.results_.clear();
    this.seen_.clear();
    this.hit_ = 0;
    this.miss_ = 0;
    this.discard_ = 0;
  }

  advance() {
    for (const key of this.results_.keys()) {
      if (!this.seen_.has(key)) {
        this.results_.delete(key);
        this.discard_++;
      }
    }
    this.seen_.clear();
    console.log(`Hit: ${this.hit_}, Miss: ${this.miss_}, Discard: ${this.discard_}`);
    this.hit_ = 0;
    this.miss_ = 0;
    this.discard_ = 0;
  }

}