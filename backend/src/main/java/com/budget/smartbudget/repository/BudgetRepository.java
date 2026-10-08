package com.budget.smartbudget.repository;

import com.budget.smartbudget.entity.Budget;
import com.budget.smartbudget.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUser(User user);
}