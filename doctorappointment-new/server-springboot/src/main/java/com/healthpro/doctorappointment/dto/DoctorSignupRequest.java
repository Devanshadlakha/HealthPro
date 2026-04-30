package com.healthpro.doctorappointment.dto;

import jakarta.validation.constraints.*;

public class DoctorSignupRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*[A-Za-z].*", message = "Password must contain a letter")
    @Pattern(regexp = ".*\\d.*", message = "Password must contain a digit")
    private String password;

    @NotBlank(message = "Mobile is required")
    @Pattern(regexp = "\\d{10}", message = "Mobile number must be 10 digits")
    private String mobile;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Experience is required")
    @Min(value = 0, message = "Experience must be between 0 and 80 years")
    @Max(value = 80, message = "Experience must be between 0 and 80 years")
    private Integer experience;

    @NotBlank(message = "Hospital is required")
    private String hospitalId;

    @NotNull(message = "Consultation fees are required")
    @Min(value = 1, message = "Consultation fees must be between 1 and 100000")
    @Max(value = 100000, message = "Consultation fees must be between 1 and 100000")
    private Integer fees;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public Integer getFees() { return fees; }
    public void setFees(Integer fees) { this.fees = fees; }
}
