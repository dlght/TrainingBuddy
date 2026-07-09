import { createFakeSupabaseClient } from "../helpers/fakeSupabase";

describe("createFakeSupabaseClient", () => {
  it("selects with eq filter and maybeSingle", async () => {
    const client = createFakeSupabaseClient({ profiles: [{ id: "u1", name: "Alex" }] });

    const found = await client.from("profiles").select("*").eq("id", "u1").maybeSingle();
    expect(found.data).toEqual({ id: "u1", name: "Alex" });

    const missing = await client.from("profiles").select("*").eq("id", "u2").maybeSingle();
    expect(missing.data).toBeNull();
    expect(missing.error).toBeNull();
  });

  it("errors on single() with no matching row", async () => {
    const client = createFakeSupabaseClient({ profiles: [] });

    const result = await client.from("profiles").select("*").eq("id", "u1").single();
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("PGRST116");
  });

  it("inserts and rejects duplicate ids", async () => {
    const client = createFakeSupabaseClient({ workouts: [] });

    const insertResult = await client.from("workouts").insert({ id: "w1", name: "A" });
    expect(insertResult.error).toBeNull();
    expect(client.__store.workouts).toEqual([{ id: "w1", name: "A" }]);

    const duplicate = await client.from("workouts").insert({ id: "w1", name: "B" });
    expect(duplicate.error?.code).toBe("23505");
  });

  it("updates matching rows in place", async () => {
    const client = createFakeSupabaseClient({ workouts: [{ id: "w1", is_favourite: false }] });

    await client.from("workouts").update({ is_favourite: true }).eq("id", "w1");

    expect(client.__store.workouts[0].is_favourite).toBe(true);
  });

  it("upserts by id: updates existing, inserts new", async () => {
    const client = createFakeSupabaseClient({ workout_exercises: [{ id: "we1", order_index: 0, target_sets: 3 }] });

    await client.from("workout_exercises").upsert({ id: "we1", order_index: 0, target_sets: 5 });
    await client.from("workout_exercises").upsert({ id: "we2", order_index: 1, target_sets: 2 });

    expect(client.__store.workout_exercises).toHaveLength(2);
    expect(client.__store.workout_exercises.find((row: any) => row.id === "we1")?.target_sets).toBe(5);
  });

  it("deletes matching rows, blocked by a protected foreign key", async () => {
    const client = createFakeSupabaseClient({
      workout_exercises: [{ id: "we1" }],
      set_logs: [{ id: "s1", workout_exercise_id: "we1" }]
    });

    const blocked = await client.from("workout_exercises").delete().eq("id", "we1");
    expect(blocked.error?.code).toBe("23503");
    expect(client.__store.workout_exercises).toHaveLength(1);

    client.__store.set_logs = [];
    const allowed = await client.from("workout_exercises").delete().eq("id", "we1");
    expect(allowed.error).toBeNull();
    expect(client.__store.workout_exercises).toHaveLength(0);
  });

  it("orders and limits results", async () => {
    const client = createFakeSupabaseClient({
      workouts: [
        { id: "a", created_at: "2026-01-03" },
        { id: "b", created_at: "2026-01-01" },
        { id: "c", created_at: "2026-01-02" }
      ]
    });

    const result = await client.from("workouts").select("*").order("created_at").limit(2);
    expect((result.data as { id: string }[]).map((row) => row.id)).toEqual(["b", "c"]);
  });

  it("resolves embedded set-plan rows keyed by workout_exercise_id", async () => {
    const client = createFakeSupabaseClient({
      workout_exercises: [{ id: "we1", workout_id: "w1", order_index: 0 }],
      workout_exercise_set_plans: [
        { id: "p1", workout_exercise_id: "we1", set_number: 1 },
        { id: "p2", workout_exercise_id: "we1", set_number: 2 }
      ]
    });

    const result = await client
      .from("workout_exercises")
      .select("*, workout_exercise_set_plans(*)")
      .eq("workout_id", "w1")
      .order("order_index");

    const rows = result.data as { workout_exercise_set_plans: unknown[] }[];
    expect(rows[0].workout_exercise_set_plans).toHaveLength(2);
  });

  it("filters with in()", async () => {
    const client = createFakeSupabaseClient({
      set_logs: [
        { id: "s1", session_id: "sess1" },
        { id: "s2", session_id: "sess2" },
        { id: "s3", session_id: "sess3" }
      ]
    });

    const result = await client.from("set_logs").select("*").in("session_id", ["sess1", "sess3"]);
    expect((result.data as { id: string }[]).map((row) => row.id)).toEqual(["s1", "s3"]);
  });
});
