package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "appointments")
public class Appointment {
    @Id
    private String id;

    private String progress; // "pending" | "approved" | "ongoing" | "done" | "cancelled" | "rejected" | "failed"
    private List<String> appointedDoctorId = new ArrayList<>();
    private List<String> patientId = new ArrayList<>();
    private String profileId;       // PatientProfile.id under the patient account
    private String profileRelation; // snapshot at booking time ("self", "mother", etc.)
    private String patientname;
    private String doctorname;
    private String problem;
    private String time;
    private Boolean reviewed;

    // New fields for hospital-based booking
    private String hospitalId;
    private String slotId;
    @Indexed
    private String slotDate;
    private String slotTime;
    // When the doctor was emailed a reminder for this appointment. Null = not yet sent.
    private Instant reminderSentAt;
    private String paymentStatus;       // "pending", "paid", "failed"
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Integer fees;               // snapshot of doctor's fees at booking time (INR)

    public Appointment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProgress() { return progress; }
    public void setProgress(String progress) { this.progress = progress; }
    public List<String> getAppointedDoctorId() { return appointedDoctorId; }
    public void setAppointedDoctorId(List<String> appointedDoctorId) { this.appointedDoctorId = appointedDoctorId; }
    public List<String> getPatientId() { return patientId; }
    public void setPatientId(List<String> patientId) { this.patientId = patientId; }
    public String getPatientname() { return patientname; }
    public void setPatientname(String patientname) { this.patientname = patientname; }
    public String getDoctorname() { return doctorname; }
    public void setDoctorname(String doctorname) { this.doctorname = doctorname; }
    public String getProblem() { return problem; }
    public void setProblem(String problem) { this.problem = problem; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public Boolean getReviewed() { return reviewed; }
    public void setReviewed(Boolean reviewed) { this.reviewed = reviewed; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getSlotId() { return slotId; }
    public void setSlotId(String slotId) { this.slotId = slotId; }
    public String getSlotDate() { return slotDate; }
    public void setSlotDate(String slotDate) { this.slotDate = slotDate; }
    public String getSlotTime() { return slotTime; }
    public void setSlotTime(String slotTime) { this.slotTime = slotTime; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public Integer getFees() { return fees; }
    public void setFees(Integer fees) { this.fees = fees; }
    public Instant getReminderSentAt() { return reminderSentAt; }
    public void setReminderSentAt(Instant reminderSentAt) { this.reminderSentAt = reminderSentAt; }

    // Clinical notes
    private String consultationNotes;

    // Prescription items (e-Rx)
    private List<Map<String, String>> prescriptions = new ArrayList<>();

    // Patient-uploaded attachments (URLs under /uploads/...)
    private List<String> attachments = new ArrayList<>();

    // Pending change requested by patient: "reschedule" | "video_call" | null
    private String pendingChange;
    private String requestedSlotId;
    private String requestedSlotDate;
    private String requestedSlotTime;
    private Boolean videoCallApproved;
    private Boolean videoCallStarted;

    public String getConsultationNotes() { return consultationNotes; }
    public void setConsultationNotes(String consultationNotes) { this.consultationNotes = consultationNotes; }
    public List<Map<String, String>> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<Map<String, String>> prescriptions) { this.prescriptions = prescriptions; }
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }
    public String getPendingChange() { return pendingChange; }
    public void setPendingChange(String pendingChange) { this.pendingChange = pendingChange; }
    public String getRequestedSlotId() { return requestedSlotId; }
    public void setRequestedSlotId(String requestedSlotId) { this.requestedSlotId = requestedSlotId; }
    public String getRequestedSlotDate() { return requestedSlotDate; }
    public void setRequestedSlotDate(String requestedSlotDate) { this.requestedSlotDate = requestedSlotDate; }
    public String getRequestedSlotTime() { return requestedSlotTime; }
    public void setRequestedSlotTime(String requestedSlotTime) { this.requestedSlotTime = requestedSlotTime; }
    public Boolean getVideoCallApproved() { return videoCallApproved; }
    public void setVideoCallApproved(Boolean videoCallApproved) { this.videoCallApproved = videoCallApproved; }
    public Boolean getVideoCallStarted() { return videoCallStarted; }
    public void setVideoCallStarted(Boolean videoCallStarted) { this.videoCallStarted = videoCallStarted; }
    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }
    public String getProfileRelation() { return profileRelation; }
    public void setProfileRelation(String profileRelation) { this.profileRelation = profileRelation; }
}
