package com.budget.smartbudget.repository;

import com.budget.smartbudget.entity.Expense;
import com.budget.smartbudget.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);
}