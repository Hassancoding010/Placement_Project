"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/mock";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type Contact = { name: string; phone: string; relation: string };
const emptyContact: Contact = { name: "", phone: "", relation: "" };

export default function ProfileForm({
  initial,
  mode,
}: {
  initial?: Profile;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [bloodGroup, setBloodGroup] = useState(initial?.blood_group ?? "");
  const [allergies, setAllergies] = useState(initial?.allergies.join(", ") ?? "");
  const [conditions, setConditions] = useState(initial?.conditions.join(", ") ?? "");
  const [medicines, setMedicines] = useState(initial?.medicines.join(", ") ?? "");
  const [doctorName, setDoctorName] = useState(initial?.doctor_name ?? "");
  const [contacts, setContacts] = useState<Contact[]>(
    initial?.contacts?.length ? initial.contacts : [{ ...emptyContact }]
  );
  const [pub, setPub] = useState(
    initial?.public ?? {
      allergies: true,
      conditions: false,
      medicines: false,
      doctor_name: false,
    }
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateContact(i: number, field: keyof Contact, value: string) {
    setContacts(contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  }

  function toList(text: string) {
    return text.split(",").map((s) => s.trim()).filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) return setError("Full name is required.");
    const ageNum = Number(age);
    if (!ageNum || ageNum < 0 || ageNum > 120) return setError("Enter a valid age.");
    if (!bloodGroup) return setError("Select a blood group.");

    const filled = contacts.filter((c) => c.name || c.phone);
    if (filled.length === 0) return setError("Add at least one emergency contact.");
    for (const c of filled) {
      if (!c.name.trim()) return setError("Each contact needs a name.");
      if (!/^\+?[0-9]{10,13}$/.test(c.phone.replace(/\s/g, "")))
        return setError("Enter a valid phone number, e.g. +919800000001.");
    }

    const payload = {
      full_name: fullName.trim(),
      age: ageNum,
      blood_group: bloodGroup,
      allergies: toList(allergies),
      conditions: toList(conditions),
      medicines: toList(medicines),
      doctor_name: doctorName.trim(),
      contacts: filled,
      public: pub,
    };

    // Mock save. B's POST /api/profile (create) or PUT /api/profile/[id] (edit) will replace this.
    console.log(
      mode === "create" ? "Would POST /api/profile:" : "Would PUT /api/profile/[id]:",
      payload
    );
    setSuccess(mode === "create" ? "Profile saved (mock). Redirecting..." : "Changes saved (mock). Redirecting...");
    setTimeout(() => router.push("/dashboard"), 1000);
  }

  const input = "w-full border rounded-lg p-3 bg-white text-gray-900";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8 text-gray-900">
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-5">
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "New profile" : "Edit profile"}
        </h1>

        <div>
          <label className={label}>Full name</label>
          <input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Age</label>
            <input type="number" className={input} value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className={label}>Blood group</label>
            <select className={input} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {(
          [
            ["allergies", "Allergies", allergies, setAllergies],
            ["conditions", "Conditions", conditions, setConditions],
            ["medicines", "Medicines", medicines, setMedicines],
          ] as const
        ).map(([key, title, value, setter]) => (
          <div key={key}>
            <label className={label}>{title} (separate with commas)</label>
            <input className={input} value={value} onChange={(e) => setter(e.target.value)} />
            <label className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={pub[key]}
                onChange={(e) => setPub({ ...pub, [key]: e.target.checked })}
              />
              Show on public emergency page
            </label>
          </div>
        ))}

        <div>
          <label className={label}>Doctor name</label>
          <input className={input} value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          <label className="flex items-center gap-2 mt-1 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={pub.doctor_name}
              onChange={(e) => setPub({ ...pub, doctor_name: e.target.checked })}
            />
            Show on public emergency page
          </label>
        </div>

        <div>
          <p className="font-medium mb-2">Emergency contacts (always public)</p>
          {contacts.map((c, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
              <input className={input} placeholder="Name" value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} />
              <input className={input} placeholder="+91..." value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} />
              <input className={input} placeholder="Relation" value={c.relation} onChange={(e) => updateContact(i, "relation", e.target.value)} />
            </div>
          ))}
          {contacts.length < 3 && (
            <button type="button" onClick={() => setContacts([...contacts, { ...emptyContact }])} className="text-blue-600 text-sm underline">
              + Add another contact
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg p-3 font-semibold">
            {mode === "create" ? "Save profile" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="border rounded-lg px-5 font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}