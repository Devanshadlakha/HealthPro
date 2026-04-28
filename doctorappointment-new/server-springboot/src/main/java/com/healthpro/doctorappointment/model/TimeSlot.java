package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "timeslots")
@CompoundIndex(name = "doctor_date_idx", def = "{'doctorId': 1, 'date': 1}")
@CompoundIndex(name = "doctor_date_time_unique", def = "{'doctorId': 1, 'date': 1, 'startTime': 1}", unique = true)
public class TimeSlot {
    @Id
    private String id;

    private String doctorId;
    private String hospitalId;
    private String date;        // "2026-04-18"
    private String startTime;   // "10:00"
    private String endTime;     // "10:15"
    private String status;      // "available", "reserved", "booked"
    private String appointmentId;
    private String patientId;
    private String reservedByPatientId;
    private Instant reservedAt;

    public TimeSlot() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getReservedByPatientId() { return reservedByPatientId; }
    public void setReservedByPatientId(String reservedByPatientId) { this.reservedByPatientId = reservedByPatientId; }
    public Instant getReservedAt() { return reservedAt; }
    public void setReservedAt(Instant reservedAt) { this.reservedAt = reservedAt; }
}
