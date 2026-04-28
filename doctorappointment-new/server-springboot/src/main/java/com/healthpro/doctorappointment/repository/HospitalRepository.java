package com.healthpro.doctorappointment.repository;

import com.healthpro.doctorappointment.model.Hospital;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface HospitalRepository extends MongoRepository<Hospital, String> {
    List<Hospital> findByActiveTrue();
    List<Hospital> findByCityAndActiveTrue(String city);
    List<Hospital> findByNameContainingIgnoreCaseAndActiveTrue(String name);
    List<Hospital> findByCityAndNameContainingIgnoreCaseAndActiveTrue(String city, String name);

    @Query(value = "{ 'active': true }", fields = "{ 'city': 1 }")
    List<Hospital> findDistinctCities();
}
