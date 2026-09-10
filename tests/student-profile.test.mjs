import test from "node:test";
import assert from "node:assert/strict";
import {
  courseSelection,
  validateStep,
  registrationProfile,
  emptyRegistration,
} from "../.sites-runtime/profile-test/studentProfile.js";
const valid = () => ({
  ...emptyRegistration,
  fullName: "  Test Student  ",
  email: " Student@EXAMPLE.test ",
  password: "example-only-passphrase",
  confirmPassword: "example-only-passphrase",
  school: "  Example School ",
  city: " Hyderabad ",
  grade: "11",
  stream: "pcm",
  gradeConfirmed: true,
});
test("no grade default and rejects unsupported grades", () => {
  for (const grade of ["", "5", "13", "11.5", "011", "not-a-grade"]) {
    assert.deepEqual(courseSelection(grade, "pcm"), []);
    assert.ok(validateStep({ ...valid(), grade }, 1).grade);
  }
});
test("upper secondary requires a valid stream", () => {
  for (const grade of ["11", "12"]) {
    assert.ok(validateStep({ ...valid(), grade, stream: "" }, 1).stream);
    assert.ok(validateStep({ ...valid(), grade, stream: "admin" }, 1).stream);
    assert.deepEqual(courseSelection(grade, "pcb"), [
      "Physics",
      "Chemistry",
      "Biology",
    ]);
    assert.deepEqual(courseSelection(grade, "commerce"), ["Commerce"]);
  }
});
test("lower secondary cannot inherit upper-secondary courses", () => {
  const d = { ...valid(), grade: "8" };
  assert.deepEqual(courseSelection(d.grade, d.stream), [
    "Mathematics",
    "Science",
  ]);
  assert.equal(registrationProfile(d).stream, null);
});
test("password mismatch and unconfirmed grade block registration", () => {
  assert.ok(
    validateStep({ ...valid(), confirmPassword: "different" }, 0)
      .confirmPassword,
  );
  assert.throws(() =>
    registrationProfile({ ...valid(), gradeConfirmed: false }),
  );
});
test("profile normalizes input and excludes passwords and client roles", () => {
  const p = registrationProfile(valid());
  assert.equal(p.grade, 11);
  assert.equal(p.full_name, "Test Student");
  assert.equal(p.email, "student@example.test");
  assert.equal(p.school_name, "Example School");
  assert.ok(!("password" in p));
  assert.ok(!("confirmPassword" in p));
  assert.ok(!("role" in p));
});
