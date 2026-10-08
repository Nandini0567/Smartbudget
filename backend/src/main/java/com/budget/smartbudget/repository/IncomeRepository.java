package com.budget.smartbudget.repository;

import com.budget.smartbudget.entity.Income;
import com.budget.smartbudget.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncomeRepository extends JpaRepository<Income, Long> {

    List<Income> findByUser(User user);
}