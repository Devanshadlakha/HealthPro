package com.healthpro.doctorappointment.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "appointments")
public class Appointment {
    @Id
    private String id;

    private String progress; // "toaccept", "received", "ongoing", "done"
    private List<String> presentDoctorIds = new ArrayList<>();
    private List<String> appointedDoctorId = new ArrayList<>();
    private List<String> patientId = new ArrayList<>();
    private String patientname;
    private String doctorname;
    private String problem;
    private String time;
    private Boolean reviewed;

    // New fields for hospital-based booking
    private String hospitalId;
    private String slotId;
    private String slotDate;
    private String slotTime;
    private String paymentStatus;       // "pending", "paid", "failed"
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Integer fees;               // snapshot of doctor's fees at booking time (INR)

    public Appointment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProgress() { return progress; }
    public void setProgress(String progress) { this.progress = progress; }
    public List<String> getPresentDoctorIds() { return presentDoctorIds; }
    public void setPresentDoctorIds(List<String> presentDoctorIds) { this.presentDoctorIds = presentDoctorIds; }
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

    // Clinical notes
    private String consultationNotes;

    public String getConsultationNotes() { return consultationNotes; }
    public void setConsultationNotes(String consultationNotes) { this.consultationNotes = consultationNotes; }
}
