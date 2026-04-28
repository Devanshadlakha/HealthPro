package com.healthpro.doctorappointment.scheduler;

import com.healthpro.doctorappointment.model.TimeSlot;
import com.healthpro.doctorappointment.repository.TimeSlotRepository;
import com.healthpro.doctorappointment.service.SlotService;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@EnableScheduling
public class SlotExpiryScheduler {

    private final TimeSlotRepository timeSlotRepository;
    private final SlotService slotService;

    public SlotExpiryScheduler(TimeSlotRepository timeSlotRepository, SlotService slotService) {
        this.timeSlotRepository = timeSlotRepository;
        this.slotService = slotService;
    }

    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void expireReservedSlots() {
        Instant cutoff = Instant.now().minus(10, ChronoUnit.MINUTES);
        List<TimeSlot> expiredSlots = timeSlotRepository.findByStatusAndReservedAtBefore("reserved", cutoff);

        for (TimeSlot slot : expiredSlots) {
            if (slot.getAppointmentId() != null) {
                slotService.failBooking(slot.getAppointmentId());
            } else {
                // No appointment created yet, just revert slot
                slot.setStatus("available");
                slot.setReservedByPatientId(null);
                slot.setReservedAt(null);
                timeSlotRepository.save(slot);
            }
        }

        if (!expiredSlots.isEmpty()) {
            System.out.println("Expired " + expiredSlots.size() + " reserved slots");
        }
    }
}
