import { expect, it } from "vitest";
import { publicToProfile, toPublicView } from "./public-view";

const view = {
  full_name: "Ravi", age: 72, blood_group: "B+",
  contacts: [{ name: "Anita", phone: "9800000001", relation: "Daughter" }],
  allergies: [],
};

it("keeps public fields while stripping identifiers, emails and visibility settings", () => {
  const raw = {
    ...view,
    id: "profile-id", owner_id: "owner-id", public_token: "secret", email: "owner@example.com",
    contacts: [{ ...view.contacts[0], id: "contact-id", profile_id: "profile-id", email: "contact@example.com" }],
    public: { doctor_name: false },
  };
  expect(toPublicView(raw)).toEqual(view);
});

it("fills missing values for the frontend and keeps a shared empty list visible", () => {
  expect(publicToProfile(view)).toEqual({
    ...view,
    conditions: [],
    medicines: [],
    doctor_name: "",
    public: { allergies: true, conditions: false, medicines: false, doctor_name: false },
  });
});
