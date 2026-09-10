import test from "node:test";
import assert from "node:assert/strict";
import { getCourses } from "../.sites-runtime/workspace-test/workspace/data.js";
test("grades 6–10 never expose upper secondary stream subjects", () => {
  for (let grade = 6; grade <= 10; grade++)
    assert.deepEqual(
      getCourses(String(grade), "pcmb").map((c) => c.id),
      ["mathematics", "science"],
    );
});
test("upper secondary streams isolate the right course set", () => {
  for (const grade of ["11", "12"]) {
    assert.deepEqual(
      getCourses(grade, "commerce").map((c) => c.id),
      ["commerce"],
    );
    assert.deepEqual(
      getCourses(grade, "pcb").map((c) => c.id),
      ["physics", "chemistry", "biology"],
    );
    assert.equal(getCourses(grade, "pcmb").length, 4);
    assert.deepEqual(getCourses(grade, "invalid"), []);
  }
});
test("class 11 and 12 expose different maths and physics samplers", () => {
  assert.equal(getCourses("11", "pcm")[0].chapter, "Sets");
  assert.equal(getCourses("12", "pcm")[0].chapter, "Matrices");
  assert.notEqual(
    getCourses("11", "pcm")[1].questions[0].prompt,
    getCourses("12", "pcm")[1].questions[0].prompt,
  );
});
test("each sampler has valid answer indices, unique ids, and concept tags", () => {
  for (let g = 6; g <= 12; g++) {
    for (const stream of ["pcm", "pcb", "pcmb", "commerce"]) {
      for (const c of getCourses(String(g), stream)) {
        assert.equal(
          new Set(c.questions.map((q) => q.id)).size,
          c.questions.length,
        );
        for (const q of c.questions) {
          assert.ok(
            Number.isInteger(q.answer) &&
              q.answer >= 0 &&
              q.answer < q.options.length,
          );
          assert.ok(c.concepts.includes(q.concept));
          assert.ok(q.explanation.trim().length > 0);
        }
      }
    }
  }
});
