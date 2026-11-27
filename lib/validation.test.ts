import { expect, it } from "vitest";
import { validateProfileInput } from "./validation";

const input = {
  full_name: " Ravi Kumar ",
  age: 72,
  blood_group: "B+",
  contacts: [{ name: " Anita ", phone: "+91 9800000001", relation: " Daughter ", id: "ignored" }],
  owner_id: "ignored",
};

it("normalizes a minimal profile, fills defaults and drops unknown fields", () => {
  expect(validateProfileInput(input)).toEqual({
    ok: true,
    value: {
      full_name: "Ravi Kumar",
      age: 72,
      blood_group: "B+",
      allergies: [],
      conditions: [],
      medicines: [],
      doctor_name: "",
      contacts: [{ name: "Anita", phone: "+919800000001", relation: "Daughter" }],
      public: { allergies: false, conditions: false, medicines: false, doctor_name: false },
    },
  });
});

it("accepts age zero and preserves explicitly shared information", () => {
  expect(validateProfileInput({
    ...input,
    age: 0,
    allergies: [" Penicillin "],
    public: { allergies: true, owner_id: true },
  })).toMatchObject({
    ok: true,
    value: {
      age: 0,
      allergies: ["Penicillin"],
      public: { allergies: true, conditions: false, medicines: false, doctor_name: false },
    },
  });
});

it.each([
  { full_name: "   " },
  { full_name: "A".repeat(201) },
  { age: 10.5 },
  { age: -1 },
  { age: 121 },
  { age: "72" },
  { blood_group: "X+" },
  { allergies: ["   "] },
  { conditions: Array(31).fill("Asthma") },
  { medicines: "Aspirin" },
  { doctor_name: null },
  { contacts: [] },
  { contacts: Array(4).fill(input.contacts[0]) },
  { contacts: [{ name: "Anita", phone: "+91-9800000001", relation: "Daughter" }] },
  { contacts: [{ name: "Anita", phone: "9800000001" }] },
  { public: { medicines: "true" } },
])("rejects invalid input %j", (fields) => {
  expect(validateProfileInput({ ...input, ...fields })).toEqual({
    ok: false,
    error: expect.stringMatching(/\S/),
  });
});
