package com.healthpro.doctorappointment.controller;

import com.healthpro.doctorappointment.model.Doctor;
import com.healthpro.doctorappointment.model.Hospital;
import com.healthpro.doctorappointment.model.Patient;
import com.healthpro.doctorappointment.repository.DoctorRepository;
import com.healthpro.doctorappointment.repository.HospitalRepository;
import com.healthpro.doctorappointment.repository.PatientRepository;
import com.healthpro.doctorappointment.service.SlotService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/seed")
public class SeedController {

    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final SlotService slotService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.token:}")
    private String seedToken;

    public SeedController(HospitalRepository hospitalRepository, DoctorRepository doctorRepository,
                          PatientRepository patientRepository, SlotService slotService,
                          PasswordEncoder passwordEncoder) {
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.slotService = slotService;
        this.passwordEncoder = passwordEncoder;
    }

    private ResponseEntity<?> guard(String headerToken) {
        if (seedToken == null || seedToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Seed endpoints are disabled"));
        }
        if (headerToken == null || !seedToken.equals(headerToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Invalid seed token"));
        }
        return null;
    }

    @PostMapping("/all")
    public ResponseEntity<?> seedAll(@RequestHeader(value = "X-Seed-Token", required = false) String headerToken) {
        ResponseEntity<?> denied = guard(headerToken);
        if (denied != null) return denied;

        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Seed hospitals
        hospitalRepository.deleteAll();
        List<Hospital> hospitals = createHospitals();
        hospitalRepository.saveAll(hospitals);
        result.put("hospitals", hospitals.size());

        // 2. Seed doctors — delete existing seed doctors first, then recreate
        String hashedPassword = passwordEncoder.encode("Doctor@123");
        List<Doctor> seededDoctors = new ArrayList<>();
        for (Hospital h : hospitals) {
            List<Doctor> docs = createDoctorsForHospital(h, hashedPassword);
            for (Doctor d : docs) {
                doctorRepository.findByEmail(d.getEmail()).ifPresent(existing -> doctorRepository.delete(existing));
                doctorRepository.save(d);
                seededDoctors.add(d);
            }
        }
        result.put("doctors", seededDoctors.size());

        // 3. Seed patients
        String patientPassword = passwordEncoder.encode("Patient@123");
        int patientsCreated = seedPatients(patientPassword);
        result.put("patients", patientsCreated);

        // 4. Generate slots for 3 days
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        int totalSlots = 0;
        for (Doctor doctor : seededDoctors) {
            for (int day = 0; day < 3; day++) {
                String date = LocalDate.now().plusDays(day).format(fmt);
                try {
                    var slots = slotService.generateSlots(doctor.getId(), doctor.getHospitalId(), date, "09:00", "17:00");
                    totalSlots += slots.size();
                } catch (Exception e) {
                    // Slot might already exist, skip
                }
            }
        }
        result.put("slots", totalSlots);

        result.put("message", "Seed complete!");
        result.put("doctorLogin", "any-doctor-email / Doctor@123");
        result.put("patientLogin", "rahul.verma@gmail.com / Patient@123");
        return ResponseEntity.ok(result);
    }

    private List<Hospital> createHospitals() {
        List<Hospital> list = new ArrayList<>();

        // Fortis Hospitals
        list.add(makeHospital("Fortis Memorial Research Institute",
                "A flagship 1000+ bed quaternary care hospital offering world-class treatment across 40+ specialities with cutting-edge technology.",
                "Gurugram", "Sector 44, Gurugram, Haryana 122002", "+91-124-4962200",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Fortis_Memorial_Research_Institute%2C_Gurgaon.jpg/1280px-Fortis_Memorial_Research_Institute%2C_Gurgaon.jpg",
                List.of("Cardiology", "Neurology", "Oncology", "Orthopaedics", "Gastroenterology", "Nephrology")));

        list.add(makeHospital("Fortis Escorts Heart Institute",
                "India's premier cardiac care centre with over 3 decades of excellence in heart surgery, interventional cardiology, and cardiac rehabilitation.",
                "New Delhi", "Okhla Road, Sukhdev Vihar, New Delhi 110025", "+91-11-47135000",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Escorts_Heart_Institute.jpg/1280px-Escorts_Heart_Institute.jpg",
                List.of("Cardiology", "Cardiac Surgery", "Vascular Surgery", "Pulmonology")));

        list.add(makeHospital("Fortis Hospital Noida",
                "A 200-bed multi-speciality hospital providing comprehensive healthcare with advanced surgical suites and 24/7 emergency services.",
                "Noida", "B-22, Sector 62, Noida, Uttar Pradesh 201301", "+91-120-4300222",
                "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80",
                List.of("General Medicine", "Orthopaedics", "Gynaecology", "Paediatrics", "ENT")));

        list.add(makeHospital("Fortis Hospital Mohali",
                "A leading 344-bed hospital in Punjab offering advanced healthcare across multiple specialities with international-standard infrastructure.",
                "Mohali", "Phase 8, Industrial Area, Mohali, Punjab 160059", "+91-172-4692222",
                "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
                List.of("Cardiology", "Neurosurgery", "Urology", "Orthopaedics", "Oncology")));

        list.add(makeHospital("Fortis Hospital Bengaluru",
                "A 250-bed multi-speciality hospital on Bannerghatta Road offering advanced treatments in oncology, orthopaedics, and organ transplants.",
                "Bengaluru", "154/9, Bannerghatta Road, Bengaluru 560076", "+91-80-66214444",
                "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80",
                List.of("Oncology", "Orthopaedics", "Nephrology", "Cardiology", "Neurology")));

        // Max Hospitals
        list.add(makeHospital("Max Super Speciality Hospital, Saket",
                "A 500-bed tertiary care hospital and one of Delhi's largest private hospitals with cutting-edge technology and expert clinicians.",
                "New Delhi", "1, Press Enclave Road, Saket, New Delhi 110017", "+91-11-26515050",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Max_Super_Speciality_Hospital%2C_Saket%2C_New_Delhi.jpg/1280px-Max_Super_Speciality_Hospital%2C_Saket%2C_New_Delhi.jpg",
                List.of("Oncology", "Neurosciences", "Cardiac Sciences", "Orthopaedics", "Liver Transplant", "Kidney Transplant")));

        list.add(makeHospital("Max Super Speciality Hospital, Patparganj",
                "A 300-bed hospital in East Delhi providing specialised care in cardiac surgery, joint replacement, and minimally invasive procedures.",
                "New Delhi", "108A, IP Extension, Patparganj, New Delhi 110092", "+91-11-42444444",
                "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&q=80",
                List.of("Cardiac Sciences", "Orthopaedics", "Gastroenterology", "Urology", "General Surgery")));

        list.add(makeHospital("Max Hospital Gurugram",
                "A 350-bed multi-super speciality hospital with state-of-the-art robotic surgery centre and advanced cancer treatment facilities.",
                "Gurugram", "B Block, Sushant Lok 1, Gurugram, Haryana 122001", "+91-124-4585555",
                "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&q=80",
                List.of("Robotic Surgery", "Oncology", "Neurosciences", "Cardiac Sciences", "Nephrology")));

        list.add(makeHospital("Max Super Speciality Hospital, Vaishali",
                "A 200-bed facility in Ghaziabad providing quality healthcare with expert doctors across multiple departments and modern diagnostic labs.",
                "Ghaziabad", "W-3, Sector 1, Vaishali, Ghaziabad, UP 201012", "+91-120-4888888",
                "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
                List.of("General Medicine", "Dermatology", "Paediatrics", "Gynaecology", "Pulmonology", "ENT")));

        list.add(makeHospital("Max Hospital Dehradun",
                "A 200-bed state-of-the-art hospital bringing Max Healthcare's excellence to Uttarakhand with advanced diagnostics and surgical care.",
                "Dehradun", "Mussoorie Diversion Road, Dehradun, Uttarakhand 248001", "+91-135-6673333",
                "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
                List.of("Cardiology", "Orthopaedics", "General Medicine", "Paediatrics", "Neurology")));

        return list;
    }

    private Hospital makeHospital(String name, String desc, String city, String address, String phone, String imageUrl, List<String> specs) {
        Hospital h = new Hospital();
        h.setName(name);
        h.setDescription(desc);
        h.setCity(city);
        h.setAddress(address);
        h.setPhone(phone);
        h.setImageUrl(imageUrl);
        h.setSpecializations(specs);
        h.setActive(true);
        return h;
    }

    private List<Doctor> createDoctorsForHospital(Hospital hospital, String hashedPassword) {
        List<Doctor> doctors = new ArrayList<>();
        String hName = hospital.getName();
        String hId = hospital.getId();

        if (hName.contains("Fortis Memorial")) {
            doctors.add(makeDoctor("Dr. Ashok Seth", "ashok.seth@fortis.com", "Cardiology", "Chairman - Cardiac Sciences", "MBBS, MD, DM (Cardiology), FACC", 35, 2000, "male", hId, hashedPassword, "One of India's leading interventional cardiologists with over 35 years and 50,000+ cardiac procedures."));
            doctors.add(makeDoctor("Dr. Simmardeep Gill", "simmardeep.gill@fortis.com", "Neurology", "Director - Neurology", "MBBS, MD, DM (Neurology)", 20, 1500, "male", hId, hashedPassword, "Expert neurologist specializing in stroke management, epilepsy, and movement disorders."));
            doctors.add(makeDoctor("Dr. Nitesh Rohatgi", "nitesh.rohatgi@fortis.com", "Oncology", "Director - Medical Oncology", "MBBS, MD, DM (Medical Oncology)", 18, 1800, "male", hId, hashedPassword, "Renowned oncologist with expertise in breast cancer, lung cancer, and targeted therapies."));
            doctors.add(makeDoctor("Dr. Mrinal Sharma", "mrinal.sharma@fortis.com", "Orthopaedics", "Senior Consultant", "MBBS, MS (Ortho), Fellowship", 15, 1200, "male", hId, hashedPassword, "Specialist in joint replacement surgery and sports medicine with 5000+ successful surgeries."));
        } else if (hName.contains("Fortis Escorts")) {
            doctors.add(makeDoctor("Dr. Z.S. Meharwal", "zs.meharwal@fortis.com", "Cardiac Surgery", "Executive Director - CTVS", "MBBS, MS, MCh (CTVS)", 30, 2500, "male", hId, hashedPassword, "Pioneer in beating heart surgery with over 20,000 open-heart surgeries."));
            doctors.add(makeDoctor("Dr. Aparna Jaswal", "aparna.jaswal@fortis.com", "Cardiology", "Director - Cardiac Electrophysiology", "MBBS, MD, DM (Cardiology)", 22, 1800, "female", hId, hashedPassword, "Leading cardiac electrophysiologist specializing in complex arrhythmia ablations."));
            doctors.add(makeDoctor("Dr. Vivek Kumar", "vivek.kumar.fortis@fortis.com", "Vascular Surgery", "Principal Consultant", "MBBS, MS, MCh (Vascular Surgery)", 16, 1500, "male", hId, hashedPassword, "Expert in minimally invasive vascular interventions and aortic aneurysm repair."));
        } else if (hName.contains("Fortis") && hName.contains("Noida")) {
            doctors.add(makeDoctor("Dr. Rahul Bhargava", "rahul.bhargava@fortis.com", "General Medicine", "Director - Internal Medicine", "MBBS, MD (Medicine), FICP", 25, 1000, "male", hId, hashedPassword, "Senior physician with vast experience in complex multi-organ diseases and critical care."));
            doctors.add(makeDoctor("Dr. Shalini Gupta", "shalini.gupta@fortis.com", "Gynaecology", "Senior Consultant", "MBBS, MS (OBG), DNB", 14, 1200, "female", hId, hashedPassword, "Specialist in high-risk pregnancies and laparoscopic gynaecological surgery."));
            doctors.add(makeDoctor("Dr. Ravi Shankar", "ravi.shankar@fortis.com", "Paediatrics", "Consultant", "MBBS, MD (Paediatrics)", 12, 800, "male", hId, hashedPassword, "Experienced paediatrician in newborn care and childhood infections."));
        } else if (hName.contains("Fortis") && hName.contains("Mohali")) {
            doctors.add(makeDoctor("Dr. R.K. Jaswal", "rk.jaswal@fortis.com", "Cardiology", "Director - Cardiology", "MBBS, MD, DM (Cardiology), FESC", 28, 1500, "male", hId, hashedPassword, "Expert in interventional cardiology with pioneering work in complex angioplasties."));
            doctors.add(makeDoctor("Dr. Paramjeet Kaur", "paramjeet.kaur@fortis.com", "Neurosurgery", "Senior Consultant", "MBBS, MS, MCh (Neurosurgery)", 19, 1800, "female", hId, hashedPassword, "Skilled neurosurgeon specializing in brain tumours and spinal surgery."));
        } else if (hName.contains("Fortis") && hName.contains("Bengaluru")) {
            doctors.add(makeDoctor("Dr. Manish Mattoo", "manish.mattoo@fortis.com", "Oncology", "Director - Oncology", "MBBS, MD, DM (Medical Oncology)", 22, 1800, "male", hId, hashedPassword, "Leading oncologist specializing in chemotherapy protocols and immunotherapy."));
            doctors.add(makeDoctor("Dr. Vidya Desai", "vidya.desai@fortis.com", "Nephrology", "Senior Consultant", "MBBS, MD, DM (Nephrology)", 16, 1500, "female", hId, hashedPassword, "Expert in kidney transplants and dialysis management."));
            doctors.add(makeDoctor("Dr. Sunil Rao", "sunil.rao@fortis.com", "Orthopaedics", "Consultant", "MBBS, MS (Ortho)", 10, 1000, "male", hId, hashedPassword, "Specialist in arthroscopic surgery and sports injuries."));
        } else if (hName.contains("Max") && hName.contains("Saket")) {
            doctors.add(makeDoctor("Dr. Harit Chaturvedi", "harit.chaturvedi@max.com", "Oncology", "Chairman - Cancer Surgery", "MBBS, MS, MCh (Surgical Oncology)", 32, 2500, "male", hId, hashedPassword, "One of India's top surgical oncologists with 30+ years in cancer treatment."));
            doctors.add(makeDoctor("Dr. Vivek Nangia", "vivek.nangia@max.com", "Pulmonology", "Principal Director", "MBBS, MD (Pulmonary Medicine), FCCP", 26, 1800, "male", hId, hashedPassword, "Leading pulmonologist in interventional pulmonology and COPD management."));
            doctors.add(makeDoctor("Dr. Kumud Rai", "kumud.rai@max.com", "Neurosciences", "Principal Consultant", "MBBS, MD, DM (Neurology), FRCP", 24, 2000, "male", hId, hashedPassword, "Expert in Parkinson's disease, dementia, and autoimmune neurological disorders."));
            doctors.add(makeDoctor("Dr. Meena Gupta", "meena.gupta@max.com", "Cardiac Sciences", "Associate Director", "MBBS, MD, DM (Cardiology)", 20, 1800, "female", hId, hashedPassword, "Experienced cardiologist focused on preventive cardiology and heart failure."));
        } else if (hName.contains("Max") && hName.contains("Patparganj")) {
            doctors.add(makeDoctor("Dr. Sanjay Kumar", "sanjay.kumar@max.com", "Cardiac Sciences", "Director - CTVS", "MBBS, MS, MCh (CTVS), FIACS", 22, 2000, "male", hId, hashedPassword, "Expert cardiac surgeon in bypass surgery and valve replacement."));
            doctors.add(makeDoctor("Dr. Pradeep Sharma", "pradeep.sharma@max.com", "Orthopaedics", "Senior Director", "MBBS, MS (Ortho), MCh", 25, 1500, "male", hId, hashedPassword, "Expert in knee and hip replacement with 8000+ surgeries."));
            doctors.add(makeDoctor("Dr. Anita Sharma", "anita.sharma@max.com", "Gastroenterology", "Consultant", "MBBS, MD, DM (Gastro)", 14, 1200, "female", hId, hashedPassword, "Specialist in endoscopy, liver diseases, and inflammatory bowel disease."));
        } else if (hName.contains("Max") && hName.contains("Gurugram")) {
            doctors.add(makeDoctor("Dr. Rajesh Ahlawat", "rajesh.ahlawat@max.com", "Robotic Surgery", "Chairman - Urology", "MBBS, MS, MCh (Urology), FRCS", 33, 2500, "male", hId, hashedPassword, "Pioneer of robotic surgery in India with 10,000+ procedures."));
            doctors.add(makeDoctor("Dr. Sandeep Budhiraja", "sandeep.budhiraja@max.com", "General Medicine", "Group Medical Director", "MBBS, MD (Medicine), FCCP", 30, 2000, "male", hId, hashedPassword, "Group Medical Director of Max Healthcare, expert in internal medicine."));
            doctors.add(makeDoctor("Dr. Neelam Mohan", "neelam.mohan@max.com", "Paediatrics", "Director - Paediatric GI", "MBBS, MD, DM (Paediatric GI)", 28, 1800, "female", hId, hashedPassword, "India's top paediatric hepatologist specializing in liver transplants."));
        } else if (hName.contains("Max") && hName.contains("Vaishali")) {
            doctors.add(makeDoctor("Dr. Arun Garg", "arun.garg@max.com", "General Medicine", "Associate Director", "MBBS, MD (Medicine)", 18, 1000, "male", hId, hashedPassword, "Experienced physician managing diabetes, hypertension, and thyroid disorders."));
            doctors.add(makeDoctor("Dr. Pooja Mehta", "pooja.mehta@max.com", "Dermatology", "Consultant", "MBBS, MD (Dermatology), DVD", 10, 800, "female", hId, hashedPassword, "Specialist in cosmetic dermatology, acne, and laser treatments."));
            doctors.add(makeDoctor("Dr. Suresh Pandey", "suresh.pandey@max.com", "Pulmonology", "Senior Consultant", "MBBS, MD (Pulmonary Medicine)", 16, 1200, "male", hId, hashedPassword, "Expert in asthma, sleep disorders, and interventional bronchoscopy."));
        } else if (hName.contains("Max") && hName.contains("Dehradun")) {
            doctors.add(makeDoctor("Dr. Amit Batra", "amit.batra@max.com", "Cardiology", "Director - Cardiology", "MBBS, MD, DM (Cardiology)", 20, 1500, "male", hId, hashedPassword, "Senior cardiologist with expertise in angioplasty and pacemaker implantation."));
            doctors.add(makeDoctor("Dr. Rekha Singh", "rekha.singh@max.com", "Gynaecology", "Senior Consultant", "MBBS, MS (OBG), FRCOG", 17, 1200, "female", hId, hashedPassword, "Expert in high-risk pregnancies and minimally invasive gynaecological surgery."));
            doctors.add(makeDoctor("Dr. Pankaj Tyagi", "pankaj.tyagi@max.com", "General Medicine", "Consultant", "MBBS, MD (Medicine)", 12, 800, "male", hId, hashedPassword, "Physician specializing in infectious diseases and preventive healthcare."));
        }

        return doctors;
    }

    private Doctor makeDoctor(String name, String email, String spec, String designation,
                              String qualification, int exp, int fees, String gender,
                              String hospitalId, String hashedPassword, String about) {
        Doctor d = new Doctor();
        d.setName(name);
        d.setEmail(email);
        d.setSpecialization(spec);
        d.setDesignation(designation);
        d.setQualification(qualification);
        d.setExperience(exp);
        d.setFees(fees);
        d.setGender(gender);
        d.setHospitalId(hospitalId);
        d.setPassword(hashedPassword);
        d.setMobile("+91-98" + String.format("%08d", new Random().nextInt(100000000)));
        d.setVerified(true);
        d.setAbout(about);
        return d;
    }

    private int seedPatients(String hashedPassword) {
        String[][] patients = {
                {"Rahul Verma", "rahul.verma@gmail.com", "9876543210", "32", "1994-03-15", "male"},
                {"Priya Sharma", "priya.sharma@gmail.com", "9876543211", "28", "1998-07-22", "female"},
                {"Amit Patel", "amit.patel@gmail.com", "9876543212", "45", "1981-11-05", "male"},
                {"Sneha Gupta", "sneha.gupta@gmail.com", "9876543213", "35", "1991-01-18", "female"},
                {"Vikram Singh", "vikram.singh@gmail.com", "9876543214", "40", "1986-09-10", "male"},
        };

        int count = 0;
        for (String[] p : patients) {
            if (patientRepository.findByEmail(p[1]).isPresent()) continue;
            Patient patient = new Patient();
            patient.setName(p[0]);
            patient.setEmail(p[1]);
            patient.setMobile("+91-" + p[2]);
            patient.setAge(Integer.parseInt(p[3]));
            patient.setDob(p[4]);
            patient.setGender(p[5]);
            patient.setPassword(hashedPassword);
            patient.setVerified(true);
            patientRepository.save(patient);
            count++;
        }
        return count;
    }

    @PostMapping("/hospitals")
    public ResponseEntity<?> seedHospitals(@RequestHeader(value = "X-Seed-Token", required = false) String t) {
        return seedAll(t);
    }

    @PostMapping("/doctors")
    public ResponseEntity<?> seedDoctors(@RequestHeader(value = "X-Seed-Token", required = false) String t) {
        return seedAll(t);
    }

    @PostMapping("/slots")
    public ResponseEntity<?> seedSlots(@RequestHeader(value = "X-Seed-Token", required = false) String t) {
        return seedAll(t);
    }
}
