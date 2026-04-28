package com.healthpro.doctorappointment.model;

public class Rating {
    private String appointmentId;
    private String patientName;
    private int rate;
    private String comment;

    public Rating() {}

    public Rating(String appointmentId, String patientName, int rate, String comment) {
        this.appointmentId = appointmentId;
        this.patientName = patientName;
        this.rate = rate;
        this.comment = comment;
    }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public int getRate() { return rate; }
    public void setRate(int rate) { this.rate = rate; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
