package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "doctors")
public class Doctor {
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
    private Integer experience;
    private String specialization;
    private String gender;
    private List<Rating> rating = new ArrayList<>();

    // New fields for hospital-based platform
    private String hospitalId;
    private String designation;
    private String photoUrl;
    private Integer fees;
    private String qualification;
    private String about;

    public Doctor() {}

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
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public List<Rating> getRating() { return rating; }
    public void setRating(List<Rating> rating) { this.rating = rating; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public Integer getFees() { return fees; }
    public void setFees(Integer fees) { this.fees = fees; }
    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    public String getAbout() { return about; }
    public void setAbout(String about) { this.about = about; }

    // Weekly availability schedule
    private Map<String, Object> weeklySchedule;

    // Monday (ISO yyyy-MM-dd) of the week the current weeklySchedule applies to.
    // Used to lock the scheduler until that week has passed.
    private String scheduleWeekStart;

    public Map<String, Object> getWeeklySchedule() { return weeklySchedule; }
    public void setWeeklySchedule(Map<String, Object> weeklySchedule) { this.weeklySchedule = weeklySchedule; }
    public String getScheduleWeekStart() { return scheduleWeekStart; }
    public void setScheduleWeekStart(String scheduleWeekStart) { this.scheduleWeekStart = scheduleWeekStart; }
}
