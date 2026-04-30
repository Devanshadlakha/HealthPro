package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Hospital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface HospitalRepository extends MongoRepository<Hospital, String> {
    List<Hospital> findByActiveTrue();

    Page<Hospital> findByActiveTrue(Pageable pageable);
    Page<Hospital> findByCityAndActiveTrue(String city, Pageable pageable);
    Page<Hospital> findByNameContainingIgnoreCaseAndActiveTrue(String name, Pageable pageable);
    Page<Hospital> findByCityAndNameContainingIgnoreCaseAndActiveTrue(String city, String name, Pageable pageable);

    @Query(value = "{ 'active': true }", fields = "{ 'city': 1 }")
    List<Hospital> findDistinctCities();
}
