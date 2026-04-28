package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByProgress(String progress);
    List<Appointment> findByProgressNot(String progress);
    List<Appointment> findByPatientIdContainingAndProgress(String patientId, String progress);
    List<Appointment> findByPatientIdContainingAndProgressNot(String patientId, String progress);
    List<Appointment> findByAppointedDoctorIdContainingAndProgress(String doctorId, String progress);
    List<Appointment> findByAppointedDoctorIdContainingAndSlotDate(String doctorId, String slotDate);
    List<Appointment> findByPatientIdContainingAndProgressOrderBySlotDateDesc(String patientId, String progress);
    List<Appointment> findByPatientIdContaining(String patientId);
    java.util.Optional<Appointment> findByRazorpayOrderId(String razorpayOrderId);
}
