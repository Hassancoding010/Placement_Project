import type { Contact, Profile } from "./mock";

type ValidationResult = { ok: true; value: Profile } | { ok: false; error: string };

const maxStringLength = 200;
const maxListLength = 30;
const bloodGroups = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown, required = false): value is string {
  return typeof value === "string" && value.length <= maxStringLength &&
    !value.includes("\0") && (!required || value.trim().length > 0);
}

function invalid(error: string): ValidationResult {
  return { ok: false, error };
}

export function validateProfileInput(input: unknown): ValidationResult {
  if (!isObject(input)) return invalid("Profile must be an object.");

  const { full_name, age, blood_group, doctor_name = "", contacts } = input;
  if (!isText(full_name, true)) return invalid("Full name must be 1 to 200 characters.");
  if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
    return invalid("Age must be a whole number from 0 to 120.");
  }
  if (typeof blood_group !== "string" || !bloodGroups.has(blood_group)) {
    return invalid("Choose a valid blood group.");
  }
  if (!isText(doctor_name)) return invalid("Doctor name must be a string of up to 200 characters.");

  const lists = { allergies: [] as string[], conditions: [] as string[], medicines: [] as string[] };
  for (const field of ["allergies", "conditions", "medicines"] as const) {
    const items = input[field];
    if (items === undefined) continue;
    if (!Array.isArray(items) || items.length > maxListLength) {
      return invalid(`Enter up to 30 items for ${field}.`);
    }
    for (const item of items) {
      if (!isText(item, true)) return invalid(`Each item in ${field} must be 1 to 200 characters.`);
      lists[field].push(item.trim());
    }
  }

  if (!Array.isArray(contacts) || contacts.length < 1 || contacts.length > 3) {
    return invalid("Enter 1 to 3 emergency contacts.");
  }
  const normalizedContacts: Contact[] = [];
  for (const contact of contacts) {
    if (!isObject(contact) || !isText(contact.name, true) || !isText(contact.relation)) {
      return invalid("Each contact needs a name and a relationship field of up to 200 characters.");
    }
    const phone = isText(contact.phone) ? contact.phone.replace(/\s/g, "") : "";
    if (!/^\+?[0-9]{10,13}$/.test(phone)) {
      return invalid("Each contact phone must have 10 to 13 digits and may start with +.");
    }
    normalizedContacts.push({ name: contact.name.trim(), phone, relation: contact.relation.trim() });
  }

  const { public: visibility = {} } = input;
  if (!isObject(visibility)) return invalid("Public settings must be an object.");
  const flags = { allergies: false, conditions: false, medicines: false, doctor_name: false };
  for (const field of ["allergies", "conditions", "medicines", "doctor_name"] as const) {
    const value = visibility[field];
    if (value === undefined) continue;
    if (typeof value !== "boolean") return invalid(`The public setting for ${field} must be true or false.`);
    flags[field] = value;
  }

  return {
    ok: true,
    value: {
      full_name: full_name.trim(),
      age,
      blood_group,
      ...lists,
      doctor_name: doctor_name.trim(),
      contacts: normalizedContacts,
      public: flags,
    },
  };
}
