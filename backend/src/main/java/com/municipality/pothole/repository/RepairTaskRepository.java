package com.municipality.pothole.repository;

import com.municipality.pothole.model.RepairTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepairTaskRepository extends JpaRepository<RepairTask, Long> {
    Optional<RepairTask> findByBidId(Long bidId);

    @Query("SELECT t FROM RepairTask t WHERE t.bid.contractor.id = :contractorId")
    List<RepairTask> findByContractorId(@Param("contractorId") Long contractorId);
}
