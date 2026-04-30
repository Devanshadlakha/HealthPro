package com.healthpro.doctorappointment.dto;

import jakarta.validation.constraints.*;

public class PatientSignupRequest {

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

    @NotBlank(message = "Date of birth is required")
    private String dob;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be between 0 and 120")
    @Max(value = 120, message = "Age must be between 0 and 120")
    private Integer age;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
