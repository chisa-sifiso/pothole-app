package com.municipality.pothole.repository;

import com.municipality.pothole.model.Bid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByRfqId(Long rfqId);
    List<Bid> findByContractorId(Long contractorId);
    Optional<Bid> findByRfqIdAndContractorId(Long rfqId, Long contractorId);
}
