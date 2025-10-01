declare module 'better-sqlite3' {
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): this;
    close(): void;
    readonly open: boolean;
    readonly inTransaction: boolean;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): IterableIterator<any>;
  }

  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  namespace BetterSqlite3 {
    interface Database {
      prepare(sql: string): Statement;
      exec(sql: string): Database;
      close(): void;
      readonly open: boolean;
      readonly inTransaction: boolean;
    }

    interface Statement {
      run(...params: any[]): RunResult;
      get(...params: any[]): any;
      all(...params: any[]): any[];
      iterate(...params: any[]): IterableIterator<any>;
    }

    interface RunResult {
      changes: number;
      lastInsertRowid: number | bigint;
    }
  }

  interface BetterSqlite3Constructor {
    new (filename: string, options?: any): Database;
    (filename: string, options?: any): Database;
    Database: typeof BetterSqlite3Constructor;
  }

  const BetterSqlite3: BetterSqlite3Constructor;
  export = BetterSqlite3;
}
