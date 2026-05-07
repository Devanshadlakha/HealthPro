package com.healthpro.doctorappointment.model;

/**
 * A bookable profile under a Patient account. The Patient owns the login and one
 * or more profiles — typically self plus dependents (parents, children, spouse).
 * Embedded inside the Patient document; not a separate collection.
 */
public class PatientProfile {

    private String id;            // generated UUID at creation
    private String name;
    private String dob;
    private Integer age;
    private String gender;
    private String relation;      // "self" | "mother" | "father" | "spouse" | "son" | "daughter" | "other"
    private String allergies;     // free-form, optional
    private String bloodGroup;    // optional

    public PatientProfile() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getRelation() { return relation; }
    public void setRelation(String relation) { this.relation = relation; }
    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
}
