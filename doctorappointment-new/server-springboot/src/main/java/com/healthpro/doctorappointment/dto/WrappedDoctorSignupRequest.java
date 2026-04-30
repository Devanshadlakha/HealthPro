package com.healthpro.doctorappointment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Frontend posts {@code { formData: {...} }} for doctor signup/login. This wrapper unpacks it
 * while still letting Bean Validation traverse into the inner DTO via @Valid.
 */
public class WrappedDoctorSignupRequest {

    @NotNull
    @Valid
    private DoctorSignupRequest formData;

    public DoctorSignupRequest getFormData() { return formData; }
    public void setFormData(DoctorSignupRequest formData) { this.formData = formData; }
}
