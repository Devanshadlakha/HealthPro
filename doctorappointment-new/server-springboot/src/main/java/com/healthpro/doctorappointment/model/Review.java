package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * One review document per (appointment, patient → doctor) interaction.
 * Stored in its own collection rather than embedded in Doctor so it can be paginated,
 * filtered by date, and aggregated independently.
 */
@Document(collection = "reviews")
@CompoundIndexes({
        @CompoundIndex(name = "doctor_created_idx", def = "{ 'doctorId': 1, 'createdAt': -1 }"),
        @CompoundIndex(name = "appointment_idx", def = "{ 'appointmentId': 1 }", unique = true)
})
public class Review {

    @Id
    private String id;

    @Indexed
    private String doctorId;

    private String hospitalId;

    private String appointmentId;

    private String patientId;

    private String patientName;

    /** 1-5 inclusive. */
    private int rate;

    private String comment;

    /** Optional reply written by the doctor. */
    private String doctorReply;

    private Instant doctorRepliedAt;

    /** Patients can mark a review as edited; track when. */
    private Instant editedAt;

    private Instant createdAt;

    /** Number of other patients who marked this review as helpful. */
    private int helpfulCount;

    public Review() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getRate() { return rate; }
    public void setRate(int rate) { this.rate = rate; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getDoctorReply() { return doctorReply; }
    public void setDoctorReply(String doctorReply) { this.doctorReply = doctorReply; }
    public Instant getDoctorRepliedAt() { return doctorRepliedAt; }
    public void setDoctorRepliedAt(Instant doctorRepliedAt) { this.doctorRepliedAt = doctorRepliedAt; }
    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public int getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; }
}
