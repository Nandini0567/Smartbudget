package com.budget.smartbudget.service;

import com.budget.smartbudget.dto.BudgetAnalysis;
import com.budget.smartbudget.entity.Budget;
import com.budget.smartbudget.entity.Expense;
import com.budget.smartbudget.entity.User;
import com.budget.smartbudget.repository.BudgetRepository;
import com.budget.smartbudget.repository.ExpenseRepository;
import com.budget.smartbudget.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         UserRepository userRepository,
                         ExpenseRepository expenseRepository) {

        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
    }

    public Budget addBudget(Long userId, Budget budget) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        budget.setUser(user);

        return budgetRepository.save(budget);
    }

    public List<Budget> getUserBudgets(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return budgetRepository.findByUser(user);
    }

    public Budget updateBudget(Long budgetId,
                               Long userId,
                               Budget updatedBudget) {

        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        budget.setCategory(updatedBudget.getCategory());
        budget.setAmount(updatedBudget.getAmount());
        budget.setMonth(updatedBudget.getMonth());

        return budgetRepository.save(budget);
    }

    public void deleteBudget(Long budgetId, Long userId) {

        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        budgetRepository.delete(budget);
    }

    public List<BudgetAnalysis> getBudgetAnalysis(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Budget> budgets = budgetRepository.findByUser(user);
        List<Expense> expenses = expenseRepository.findByUser(user);

        List<BudgetAnalysis> analysisList = new ArrayList<>();

        for (Budget budget : budgets) {

            double spent = expenses.stream()
                    .filter(expense ->
                            expense.getCategory()
                                    .equalsIgnoreCase(budget.getCategory())
                    )
                    .filter(expense ->
                            expense.getDate()
                                    .toString()
                                    .startsWith(budget.getMonth())
                    )
                    .mapToDouble(Expense::getAmount)
                    .sum();

            BudgetAnalysis analysis =
                    new BudgetAnalysis(
                            budget.getCategory(),
                            budget.getAmount(),
                            spent
                    );

            analysisList.add(analysis);
        }

        return analysisList;
    }
}