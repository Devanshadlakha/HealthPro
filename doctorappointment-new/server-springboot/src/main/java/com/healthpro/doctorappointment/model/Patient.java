package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "patients")
public class Patient {
    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;
    private Boolean verified;
    private String verifyToken;
    @Indexed
    private String passwordResetToken;
    private Instant passwordResetExpiresAt;
    private String mobile;
    private Integer age;
    private String dob;
    private String gender;

    public Patient() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public String getVerifyToken() { return verifyToken; }
    public void setVerifyToken(String verifyToken) { this.verifyToken = verifyToken; }
    public String getPasswordResetToken() { return passwordResetToken; }
    public void setPasswordResetToken(String passwordResetToken) { this.passwordResetToken = passwordResetToken; }
    public Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
    public void setPasswordResetExpiresAt(Instant passwordResetExpiresAt) { this.passwordResetExpiresAt = passwordResetExpiresAt; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}
