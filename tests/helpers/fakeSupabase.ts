/**
 * A tiny in-memory stand-in for @supabase/supabase-js's query builder, used to
 * unit test the Supabase-backed services without a live database. Supports
 * exactly the operations this app's services use: eq/gte/lt/in filters,
 * order (with referencedTable for embedded resources), limit, single/
 * maybeSingle, insert/update/upsert/delete, and one level of `col(*)`
 * embedded-select for the workout_exercises -> workout_exercise_set_plans
 * relationship. It is not a general Postgres/PostgREST emulator.
 */

export type FakeRow = Record<string, unknown>;
export type FakeStore = Record<string, FakeRow[]>;

export type PgError = { message: string; code: string };

const FOREIGN_KEY_VIOLATION: PgError = {
  message: "update or delete on table violates foreign key constraint",
  code: "23503"
};

// workout_exercise_set_plans has no FK pointing at it, so it's always safe to
// delete; only workout_exercises rows can be protected by logged set_logs.
const PROTECTED_BY: Record<string, { table: string; column: string }> = {
  workout_exercises: { table: "set_logs", column: "workout_exercise_id" }
};

const EMBEDS: Record<string, { table: string; parentKey: string; childKey: string }> = {
  workout_exercise_set_plans: { table: "workout_exercise_set_plans", parentKey: "id", childKey: "workout_exercise_id" }
};

type Filter = { col: string; op: "eq" | "gte" | "lt" | "in"; val: unknown };
type Order = { col: string; ascending: boolean; referencedTable?: string };

function matchesFilter(row: FakeRow, filter: Filter): boolean {
  const value = row[filter.col];

  switch (filter.op) {
    case "eq":
      return value === filter.val;
    case "gte":
      return value !== null && value !== undefined && (value as string) >= (filter.val as string);
    case "lt":
      return value !== null && value !== undefined && (value as string) < (filter.val as string);
    case "in":
      return (filter.val as unknown[]).includes(value);
    default:
      return true;
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "boolean" && typeof b === "boolean") return a === b ? 0 : a ? 1 : -1;
  return a < b ? -1 : 1;
}

class FakeQueryBuilder {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private selectCols = "*";
  private payload: FakeRow | FakeRow[] | null = null;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private singleMode: "single" | "maybeSingle" | null = null;

  constructor(
    private store: FakeStore,
    private table: string
  ) {}

  select(cols = "*") {
    this.selectCols = cols;
    return this;
  }

  insert(payload: FakeRow | FakeRow[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: FakeRow) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: FakeRow | FakeRow[]) {
    this.op = "upsert";
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "eq", val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: "gte", val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ col, op: "lt", val });
    return this;
  }

  in(col: string, val: unknown[]) {
    this.filters.push({ col, op: "in", val });
    return this;
  }

  order(col: string, options: { ascending?: boolean; referencedTable?: string } = {}) {
    this.orders.push({ col, ascending: options.ascending !== false, referencedTable: options.referencedTable });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  then<TResult1 = { data: unknown; error: PgError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: PgError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }

  private table_(): FakeRow[] {
    this.store[this.table] ??= [];
    return this.store[this.table];
  }

  private applyEmbeds(rows: FakeRow[]): FakeRow[] {
    const embedNames = Array.from(this.selectCols.matchAll(/(\w+)\(\*\)/g)).map((match) => match[1]);

    if (embedNames.length === 0) {
      return rows;
    }

    return rows.map((row) => {
      const withEmbeds = { ...row };

      for (const embedName of embedNames) {
        const embed = EMBEDS[embedName];

        if (!embed) continue;

        const childRows = (this.store[embed.table] ?? []).filter(
          (childRow) => childRow[embed.childKey] === row[embed.parentKey]
        );

        withEmbeds[embedName] = childRows;
      }

      return withEmbeds;
    });
  }

  private finalizeSelect(rows: FakeRow[]): { data: unknown; error: PgError | null } {
    let result = this.applyEmbeds(rows);

    for (const order of this.orders.slice().reverse()) {
      const parentOrder = order.referencedTable ? null : order;

      if (!parentOrder) continue;

      result = result
        .slice()
        .sort((a, b) => (order.ascending ? 1 : -1) * compareValues(a[order.col], b[order.col]));
    }

    for (const order of this.orders) {
      if (!order.referencedTable) continue;

      result = result.map((row) => {
        const embedded = row[order.referencedTable as string];

        if (!Array.isArray(embedded)) return row;

        return {
          ...row,
          [order.referencedTable as string]: [...embedded].sort(
            (a, b) => (order.ascending ? 1 : -1) * compareValues((a as FakeRow)[order.col], (b as FakeRow)[order.col])
          )
        };
      });
    }

    if (this.limitN !== null) {
      result = result.slice(0, this.limitN);
    }

    if (this.singleMode === "single" || this.singleMode === "maybeSingle") {
      if (result.length === 0) {
        if (this.singleMode === "maybeSingle") {
          return { data: null, error: null };
        }

        return { data: null, error: { message: "The result contains 0 rows", code: "PGRST116" } };
      }

      return { data: result[0], error: null };
    }

    return { data: result, error: null };
  }

  private execute(): { data: unknown; error: PgError | null } {
    const all = this.table_();
    const matching = all.filter((row) => this.filters.every((filter) => matchesFilter(row, filter)));

    if (this.op === "select") {
      return this.finalizeSelect(matching);
    }

    if (this.op === "insert") {
      const rowsToInsert = Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow];

      for (const row of rowsToInsert) {
        if (all.some((existing) => existing.id === row.id)) {
          return { data: null, error: { message: "duplicate key value violates unique constraint", code: "23505" } };
        }

        all.push({ ...row });
      }

      return this.finalizeSelect(rowsToInsert.map((row) => ({ ...row })));
    }

    if (this.op === "update") {
      for (const row of matching) {
        Object.assign(row, this.payload as FakeRow);
      }

      return this.finalizeSelect(matching);
    }

    if (this.op === "upsert") {
      const rowsToUpsert = Array.isArray(this.payload) ? this.payload : [this.payload as FakeRow];
      const upserted: FakeRow[] = [];

      for (const row of rowsToUpsert) {
        const existing = all.find((candidate) => candidate.id === row.id);

        if (existing) {
          Object.assign(existing, row);
          upserted.push(existing);
        } else {
          const inserted = { ...row };
          all.push(inserted);
          upserted.push(inserted);
        }
      }

      return this.finalizeSelect(upserted);
    }

    if (this.op === "delete") {
      const protectedBy = PROTECTED_BY[this.table];

      if (protectedBy) {
        const referencingRows = this.store[protectedBy.table] ?? [];
        const stillReferenced = matching.some((row) =>
          referencingRows.some((referencing) => referencing[protectedBy.column] === row.id)
        );

        if (stillReferenced) {
          return { data: null, error: FOREIGN_KEY_VIOLATION };
        }
      }

      this.store[this.table] = all.filter((row) => !matching.includes(row));

      return { data: matching, error: null };
    }

    return { data: null, error: null };
  }
}

export function createFakeSupabaseClient(seed: FakeStore = {}, userId: string | null = "test-user-1") {
  const store: FakeStore = {};

  for (const [table, rows] of Object.entries(seed)) {
    store[table] = rows.map((row) => ({ ...row }));
  }

  return {
    from(table: string) {
      return new FakeQueryBuilder(store, table);
    },
    auth: {
      async getSession() {
        return {
          data: { session: userId ? { user: { id: userId } } : null },
          error: null
        };
      }
    },
    __store: store
  } as any;
}
