const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI environment variable is required.");
  console.error("Example: MONGODB_URI=\"mongodb+srv://<user>:<password>@<cluster>.mongodb.net/doctorapp\" node seed.js");
  process.exit(1);
}

// BCrypt hash for password "Doctor@123" — pre-computed so we don't need bcrypt dependency
// We'll use the Spring Boot PasswordEncoder format
const bcryptHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    const db = client.db("doctorapp");

    // Clear existing seed data
    await db.collection("hospitals").deleteMany({});
    console.log("Cleared hospitals collection");

    // ===== HOSPITALS =====
    const hospitals = [
      {
        name: "Fortis Memorial Research Institute",
        description: "A flagship multi-super speciality quaternary care hospital with 1000+ beds offering world-class treatment across 40+ specialities.",
        imageUrl: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800",
        city: "Gurugram",
        address: "Sector 44, Gurugram, Haryana 122002",
        phone: "+91-124-4962200",
        specializations: ["Cardiology", "Neurology", "Oncology", "Orthopaedics", "Gastroenterology", "Nephrology"],
        active: true
      },
      {
        name: "Fortis Escorts Heart Institute",
        description: "India's premier cardiac care centre with over 3 decades of excellence in heart surgery, interventional cardiology, and cardiac rehabilitation.",
        imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
        city: "New Delhi",
        address: "Okhla Road, Sukhdev Vihar, New Delhi 110025",
        phone: "+91-11-47135000",
        specializations: ["Cardiology", "Cardiac Surgery", "Vascular Surgery", "Pulmonology"],
        active: true
      },
      {
        name: "Fortis Hospital Noida",
        description: "A 200-bed multi-speciality hospital providing comprehensive healthcare with advanced surgical suites and 24/7 emergency services.",
        imageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
        city: "Noida",
        address: "B-22, Sector 62, Noida, Uttar Pradesh 201301",
        phone: "+91-120-4300222",
        specializations: ["General Medicine", "Orthopaedics", "Gynaecology", "Paediatrics", "ENT"],
        active: true
      },
      {
        name: "Fortis Hospital Mohali",
        description: "A leading 344-bed hospital in Punjab offering advanced healthcare across multiple specialities with international-standard infrastructure.",
        imageUrl: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800",
        city: "Mohali",
        address: "Phase 8, Industrial Area, Mohali, Punjab 160059",
        phone: "+91-172-4692222",
        specializations: ["Cardiology", "Neurosurgery", "Urology", "Orthopaedics", "Oncology"],
        active: true
      },
      {
        name: "Max Super Speciality Hospital, Saket",
        description: "A 500-bed tertiary care hospital and one of the largest private sector hospitals in Delhi with cutting-edge technology and expert clinicians.",
        imageUrl: "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800",
        city: "New Delhi",
        address: "1, Press Enclave Road, Saket, New Delhi 110017",
        phone: "+91-11-26515050",
        specializations: ["Oncology", "Neurosciences", "Cardiac Sciences", "Orthopaedics", "Liver Transplant", "Kidney Transplant"],
        active: true
      },
      {
        name: "Max Super Speciality Hospital, Patparganj",
        description: "An advanced 300-bed hospital in East Delhi providing specialised care in cardiac surgery, joint replacement, and minimally invasive procedures.",
        imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=800",
        city: "New Delhi",
        address: "108A, IP Extension, Patparganj, New Delhi 110092",
        phone: "+91-11-42444444",
        specializations: ["Cardiac Sciences", "Orthopaedics", "Gastroenterology", "Urology", "General Surgery"],
        active: true
      },
      {
        name: "Max Hospital Gurugram",
        description: "A 350-bed multi-super speciality hospital with state-of-the-art robotic surgery centre and advanced cancer treatment facilities.",
        imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
        city: "Gurugram",
        address: "B Block, Sushant Lok 1, Gurugram, Haryana 122001",
        phone: "+91-124-4585555",
        specializations: ["Robotic Surgery", "Oncology", "Neurosciences", "Cardiac Sciences", "Nephrology"],
        active: true
      },
      {
        name: "Max Super Speciality Hospital, Vaishali",
        description: "A 200-bed facility in Ghaziabad providing quality healthcare with expert doctors across multiple departments and modern diagnostic labs.",
        imageUrl: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800",
        city: "Ghaziabad",
        address: "W-3, Sector 1, Vaishali, Ghaziabad, UP 201012",
        phone: "+91-120-4888888",
        specializations: ["General Medicine", "Dermatology", "Paediatrics", "Gynaecology", "Pulmonology", "ENT"],
        active: true
      }
    ];

    const hospitalResult = await db.collection("hospitals").insertMany(hospitals);
    const hospitalIds = Object.values(hospitalResult.insertedIds).map(id => id.toString());
    console.log(`Inserted ${hospitalIds.length} hospitals`);

    // ===== DOCTORS =====
    // We need to hash passwords properly. Let's use a simple approach.
    // Since Spring Boot uses BCrypt, we'll insert with a known hash.
    // First, let's get the hash by calling the signup endpoint...
    // Actually, let's just insert directly with a pre-set password hash.
    // We'll generate it using the running Spring Boot instance.

    const doctorData = [
      // --- Fortis Memorial Research Institute, Gurugram (index 0) ---
      { name: "Dr. Ashok Seth", email: "ashok.seth@fortis.com", specialization: "Cardiology", designation: "Chairman - Cardiac Sciences", qualification: "MBBS, MD, DM (Cardiology), FACC", experience: 35, fees: 2000, gender: "male", hospitalIndex: 0, about: "One of India's leading interventional cardiologists with over 35 years of experience and 50,000+ cardiac procedures." },
      { name: "Dr. Simmardeep Gill", email: "simmardeep.gill@fortis.com", specialization: "Neurology", designation: "Director - Neurology", qualification: "MBBS, MD, DM (Neurology)", experience: 20, fees: 1500, gender: "male", hospitalIndex: 0, about: "Expert neurologist specializing in stroke management, epilepsy, and movement disorders." },
      { name: "Dr. Nitesh Rohatgi", email: "nitesh.rohatgi@fortis.com", specialization: "Oncology", designation: "Director - Medical Oncology", qualification: "MBBS, MD, DM (Medical Oncology)", experience: 18, fees: 1800, gender: "male", hospitalIndex: 0, about: "Renowned oncologist with expertise in breast cancer, lung cancer, and targeted therapies." },
      { name: "Dr. Mrinal Sharma", email: "mrinal.sharma@fortis.com", specialization: "Orthopaedics", designation: "Senior Consultant", qualification: "MBBS, MS (Ortho), Fellowship (Joint Replacement)", experience: 15, fees: 1200, gender: "male", hospitalIndex: 0, about: "Specialist in joint replacement surgery and sports medicine with 5000+ successful surgeries." },

      // --- Fortis Escorts Heart Institute, New Delhi (index 1) ---
      { name: "Dr. Z.S. Meharwal", email: "zs.meharwal@fortis.com", specialization: "Cardiac Surgery", designation: "Executive Director - CTVS", qualification: "MBBS, MS, MCh (CTVS)", experience: 30, fees: 2500, gender: "male", hospitalIndex: 1, about: "Pioneer in beating heart surgery with over 20,000 open-heart surgeries performed." },
      { name: "Dr. Aparna Jaswal", email: "aparna.jaswal@fortis.com", specialization: "Cardiology", designation: "Director - Cardiac Electrophysiology", qualification: "MBBS, MD, DM (Cardiology)", experience: 22, fees: 1800, gender: "female", hospitalIndex: 1, about: "Leading cardiac electrophysiologist specializing in complex arrhythmia ablations and device implants." },
      { name: "Dr. Vivek Kumar", email: "vivek.kumar@fortis.com", specialization: "Vascular Surgery", designation: "Principal Consultant", qualification: "MBBS, MS, MCh (Vascular Surgery)", experience: 16, fees: 1500, gender: "male", hospitalIndex: 1, about: "Expert in minimally invasive vascular interventions, varicose veins, and aortic aneurysm repair." },

      // --- Fortis Hospital Noida (index 2) ---
      { name: "Dr. Rahul Bhargava", email: "rahul.bhargava@fortis.com", specialization: "General Medicine", designation: "Director - Internal Medicine", qualification: "MBBS, MD (Medicine), FICP", experience: 25, fees: 1000, gender: "male", hospitalIndex: 2, about: "Senior physician with vast experience in managing complex multi-organ diseases and critical care." },
      { name: "Dr. Shalini Gupta", email: "shalini.gupta@fortis.com", specialization: "Gynaecology", designation: "Senior Consultant", qualification: "MBBS, MS (OBG), DNB", experience: 14, fees: 1200, gender: "female", hospitalIndex: 2, about: "Specialist in high-risk pregnancies, laparoscopic gynaecological surgery, and fertility treatments." },
      { name: "Dr. Ravi Shankar", email: "ravi.shankar@fortis.com", specialization: "Paediatrics", designation: "Consultant Paediatrician", qualification: "MBBS, MD (Paediatrics), IAP Fellow", experience: 12, fees: 800, gender: "male", hospitalIndex: 2, about: "Experienced paediatrician with expertise in newborn care, childhood infections, and developmental disorders." },

      // --- Fortis Hospital Mohali (index 3) ---
      { name: "Dr. R.K. Jaswal", email: "rk.jaswal@fortis.com", specialization: "Cardiology", designation: "Director - Cardiology", qualification: "MBBS, MD, DM (Cardiology), FESC", experience: 28, fees: 1500, gender: "male", hospitalIndex: 3, about: "Expert in interventional cardiology with pioneering work in complex angioplasties in North India." },
      { name: "Dr. Paramjeet Kaur", email: "paramjeet.kaur@fortis.com", specialization: "Neurosurgery", designation: "Senior Consultant", qualification: "MBBS, MS, MCh (Neurosurgery)", experience: 19, fees: 1800, gender: "female", hospitalIndex: 3, about: "Skilled neurosurgeon specializing in brain tumours, spinal surgery, and neuro-trauma management." },

      // --- Max Super Speciality Hospital, Saket (index 4) ---
      { name: "Dr. Harit Chaturvedi", email: "harit.chaturvedi@maxhealthcare.com", specialization: "Oncology", designation: "Chairman - Cancer Surgery", qualification: "MBBS, MS, MCh (Surgical Oncology)", experience: 32, fees: 2500, gender: "male", hospitalIndex: 4, about: "Chairman of Max Oncology and one of India's top surgical oncologists with 30+ years in cancer treatment." },
      { name: "Dr. Vivek Nangia", email: "vivek.nangia@maxhealthcare.com", specialization: "Pulmonology", designation: "Principal Director - Pulmonology", qualification: "MBBS, MD (Pulmonary Medicine), FCCP", experience: 26, fees: 1800, gender: "male", hospitalIndex: 4, about: "Leading pulmonologist with vast experience in interventional pulmonology, lung cancer, and COPD management." },
      { name: "Dr. Kumud Rai", email: "kumud.rai@maxhealthcare.com", specialization: "Neurosciences", designation: "Principal Consultant - Neurology", qualification: "MBBS, MD, DM (Neurology), FRCP", experience: 24, fees: 2000, gender: "male", hospitalIndex: 4, about: "Expert neurologist specializing in Parkinson's disease, dementia, and autoimmune neurological disorders." },
      { name: "Dr. Meena Gupta", email: "meena.gupta@maxhealthcare.com", specialization: "Cardiac Sciences", designation: "Associate Director - Cardiology", qualification: "MBBS, MD, DM (Cardiology)", experience: 20, fees: 1800, gender: "female", hospitalIndex: 4, about: "Experienced cardiologist with focus on preventive cardiology, heart failure, and women's cardiac health." },

      // --- Max Super Speciality Hospital, Patparganj (index 5) ---
      { name: "Dr. Sanjay Kumar", email: "sanjay.kumar@maxhealthcare.com", specialization: "Cardiac Sciences", designation: "Director - CTVS", qualification: "MBBS, MS, MCh (CTVS), FIACS", experience: 22, fees: 2000, gender: "male", hospitalIndex: 5, about: "Expert cardiac surgeon specializing in bypass surgery, valve replacement, and minimally invasive cardiac procedures." },
      { name: "Dr. Pradeep Sharma", email: "pradeep.sharma@maxhealthcare.com", specialization: "Orthopaedics", designation: "Senior Director - Orthopaedics", qualification: "MBBS, MS (Ortho), MCh", experience: 25, fees: 1500, gender: "male", hospitalIndex: 5, about: "Expert in knee and hip replacement, arthroscopic surgery, and complex trauma management." },
      { name: "Dr. Anita Sharma", email: "anita.sharma@maxhealthcare.com", specialization: "Gastroenterology", designation: "Consultant Gastroenterologist", qualification: "MBBS, MD, DM (Gastroenterology)", experience: 14, fees: 1200, gender: "female", hospitalIndex: 5, about: "Specialist in endoscopy, liver diseases, inflammatory bowel disease, and pancreatic disorders." },

      // --- Max Hospital Gurugram (index 6) ---
      { name: "Dr. Rajesh Ahlawat", email: "rajesh.ahlawat@maxhealthcare.com", specialization: "Robotic Surgery", designation: "Chairman - Urology & Robotic Surgery", qualification: "MBBS, MS, MCh (Urology), FRCS", experience: 33, fees: 2500, gender: "male", hospitalIndex: 6, about: "Pioneer of robotic surgery in India with 10,000+ robotic and laparoscopic procedures performed." },
      { name: "Dr. Sandeep Budhiraja", email: "sandeep.budhiraja@maxhealthcare.com", specialization: "General Medicine", designation: "Group Medical Director", qualification: "MBBS, MD (Medicine), FCCP, FICP", experience: 30, fees: 2000, gender: "male", hospitalIndex: 6, about: "Group Medical Director of Max Healthcare, expert in internal medicine and critical care with pan-India leadership role." },
      { name: "Dr. Neelam Mohan", email: "neelam.mohan@maxhealthcare.com", specialization: "Paediatrics", designation: "Director - Paediatric Gastroenterology", qualification: "MBBS, MD, DM (Paediatric GI), FRCPCH", experience: 28, fees: 1800, gender: "female", hospitalIndex: 6, about: "India's top paediatric hepatologist and gastroenterologist, specializing in paediatric liver transplants." },

      // --- Max Super Speciality Hospital, Vaishali (index 7) ---
      { name: "Dr. Arun Garg", email: "arun.garg@maxhealthcare.com", specialization: "General Medicine", designation: "Associate Director - Internal Medicine", qualification: "MBBS, MD (Medicine)", experience: 18, fees: 1000, gender: "male", hospitalIndex: 7, about: "Experienced physician managing diabetes, hypertension, thyroid disorders, and infectious diseases." },
      { name: "Dr. Pooja Mehta", email: "pooja.mehta@maxhealthcare.com", specialization: "Dermatology", designation: "Consultant Dermatologist", qualification: "MBBS, MD (Dermatology), DVD", experience: 10, fees: 800, gender: "female", hospitalIndex: 7, about: "Specialist in cosmetic dermatology, acne, eczema, and laser treatments for skin conditions." },
      { name: "Dr. Suresh Pandey", email: "suresh.pandey@maxhealthcare.com", specialization: "Pulmonology", designation: "Senior Consultant - Pulmonology", qualification: "MBBS, MD (Pulmonary Medicine)", experience: 16, fees: 1200, gender: "male", hospitalIndex: 7, about: "Expert in asthma, sleep disorders, tuberculosis, and interventional bronchoscopy." },
    ];

    // Hash the password using the Spring Boot signup endpoint
    // Actually, let's use a simpler approach - call the running backend to hash
    // Or just insert directly with a known bcrypt hash

    // Generate bcrypt hash via Node.js
    let bcryptModule;
    try {
      bcryptModule = require("bcryptjs");
    } catch(e) {
      try {
        bcryptModule = require("bcrypt");
      } catch(e2) {
        console.log("No bcrypt module found, installing bcryptjs...");
        require("child_process").execSync("npm install bcryptjs --no-save", { cwd: __dirname });
        bcryptModule = require("bcryptjs");
      }
    }

    const passwordHash = bcryptModule.hashSync("Doctor@123", 10);
    console.log("Generated password hash for all doctors");

    // Don't clear doctors collection - keep existing user-created doctors
    // Only insert new seed doctors (skip if email already exists)
    let insertedCount = 0;
    for (const doc of doctorData) {
      const existing = await db.collection("doctors").findOne({ email: doc.email });
      if (existing) {
        console.log(`  Skipping ${doc.name} (already exists)`);
        continue;
      }

      const verifyToken = crypto.randomBytes(32).toString("hex");
      await db.collection("doctors").insertOne({
        name: doc.name,
        email: doc.email,
        password: passwordHash,
        verified: true,
        verifyToken: verifyToken,
        mobile: "+91-" + (9800000000 + Math.floor(Math.random() * 199999999)).toString(),
        experience: doc.experience,
        specialization: doc.specialization,
        gender: doc.gender,
        rating: [],
        hospitalId: hospitalIds[doc.hospitalIndex],
        designation: doc.designation,
        photoUrl: null,
        fees: doc.fees,
        qualification: doc.qualification,
        about: doc.about,
        weeklySchedule: null,
        _class: "com.healthpro.doctorappointment.model.Doctor"
      });
      insertedCount++;
    }
    console.log(`Inserted ${insertedCount} doctors`);

    // ===== SAMPLE PATIENTS =====
    const patientData = [
      { name: "Rahul Verma", email: "rahul.verma@gmail.com", mobile: "+91-9876543210", age: 32, dob: "1994-03-15", gender: "male" },
      { name: "Priya Sharma", email: "priya.sharma@gmail.com", mobile: "+91-9876543211", age: 28, dob: "1998-07-22", gender: "female" },
      { name: "Amit Patel", email: "amit.patel@gmail.com", mobile: "+91-9876543212", age: 45, dob: "1981-11-05", gender: "male" },
      { name: "Sneha Gupta", email: "sneha.gupta@gmail.com", mobile: "+91-9876543213", age: 35, dob: "1991-01-18", gender: "female" },
    ];

    const patientPasswordHash = bcryptModule.hashSync("Patient@123", 10);
    let patientInserted = 0;
    for (const p of patientData) {
      const existing = await db.collection("patients").findOne({ email: p.email });
      if (existing) {
        console.log(`  Skipping patient ${p.name} (already exists)`);
        continue;
      }
      await db.collection("patients").insertOne({
        name: p.name,
        email: p.email,
        password: patientPasswordHash,
        verified: true,
        verifyToken: crypto.randomBytes(32).toString("hex"),
        mobile: p.mobile,
        age: p.age,
        dob: p.dob,
        gender: p.gender,
        _class: "com.healthpro.doctorappointment.model.Patient"
      });
      patientInserted++;
    }
    console.log(`Inserted ${patientInserted} patients`);

    // ===== GENERATE TIME SLOTS for next 7 days for all doctors =====
    const doctorsList = await db.collection("doctors").find({ hospitalId: { $in: hospitalIds } }).toArray();
    let slotCount = 0;

    for (const doctor of doctorsList) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split("T")[0]; // "2026-04-18"

        // Generate slots from 09:00 to 17:00 (15-min each)
        for (let hour = 9; hour < 17; hour++) {
          for (let min = 0; min < 60; min += 15) {
            const startTime = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
            const endMin = min + 15;
            const endHour = endMin >= 60 ? hour + 1 : hour;
            const endMinFinal = endMin >= 60 ? 0 : endMin;
            const endTime = `${endHour.toString().padStart(2, "0")}:${endMinFinal.toString().padStart(2, "0")}`;

            // Check if slot already exists
            const existing = await db.collection("timeslots").findOne({
              doctorId: doctor._id.toString(),
              date: dateStr,
              startTime: startTime
            });
            if (!existing) {
              await db.collection("timeslots").insertOne({
                doctorId: doctor._id.toString(),
                hospitalId: doctor.hospitalId,
                date: dateStr,
                startTime: startTime,
                endTime: endTime,
                status: "available",
                appointmentId: null,
                patientId: null,
                reservedByPatientId: null,
                reservedAt: null,
                _class: "com.healthpro.doctorappointment.model.TimeSlot"
              });
              slotCount++;
            }
          }
        }
      }
    }
    console.log(`Generated ${slotCount} time slots for ${doctorsList.length} doctors over 7 days`);

    console.log("\n=== SEED COMPLETE ===");
    console.log("Doctor login credentials: any doctor email + password 'Doctor@123'");
    console.log("Patient login credentials: any patient email + password 'Patient@123'");
    console.log("\nSample logins:");
    console.log("  Doctor: ashok.seth@fortis.com / Doctor@123");
    console.log("  Patient: rahul.verma@gmail.com / Patient@123");

  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
