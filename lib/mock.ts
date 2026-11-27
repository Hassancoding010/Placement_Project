import profiles from "../docs/sample-profiles.json";

export type Contact = { name: string; phone: string; relation: string };

export type Profile = {
  full_name: string;
  age: number;
  blood_group: string;
  allergies: string[];
  conditions: string[];
  medicines: string[];
  doctor_name: string;
  contacts: Contact[];
  public: {
    allergies: boolean;
    conditions: boolean;
    medicines: boolean;
    doctor_name: boolean;
  };
};

export const mockProfiles = profiles as Profile[];