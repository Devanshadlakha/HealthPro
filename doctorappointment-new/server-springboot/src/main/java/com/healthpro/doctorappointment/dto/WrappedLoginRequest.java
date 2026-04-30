package com.healthpro.doctorappointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class WrappedLoginRequest {

    @NotNull
    @Valid
    private LoginRequest formData;

    public LoginRequest getFormData() { return formData; }
    public void setFormData(LoginRequest formData) { this.formData = formData; }
}
