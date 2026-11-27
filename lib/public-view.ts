import type { Profile } from "./mock";

type OptionalFields = Pick<Profile, "allergies" | "conditions" | "medicines" | "doctor_name">;

export type PublicView = Pick<Profile, "full_name" | "age" | "blood_group" | "contacts"> &
  Partial<OptionalFields>;

export function toPublicView(raw: PublicView): PublicView {
  const { full_name, age, blood_group, contacts, allergies, conditions, medicines, doctor_name } = raw;

  return {
    full_name,
    age,
    blood_group,
    contacts: contacts.map(({ name, phone, relation }) => ({ name, phone, relation })),
    ...(allergies !== undefined ? { allergies } : {}),
    ...(conditions !== undefined ? { conditions } : {}),
    ...(medicines !== undefined ? { medicines } : {}),
    ...(doctor_name !== undefined ? { doctor_name } : {}),
  };
}

export function publicToProfile(view: PublicView): Profile {
  const { full_name, age, blood_group, contacts, allergies, conditions, medicines, doctor_name } = view;
  return {
    full_name,
    age,
    blood_group,
    contacts,
    allergies: allergies ?? [],
    conditions: conditions ?? [],
    medicines: medicines ?? [],
    doctor_name: doctor_name ?? "",
    public: {
      allergies: Object.hasOwn(view, "allergies"),
      conditions: Object.hasOwn(view, "conditions"),
      medicines: Object.hasOwn(view, "medicines"),
      doctor_name: Object.hasOwn(view, "doctor_name"),
    },
  };
}
