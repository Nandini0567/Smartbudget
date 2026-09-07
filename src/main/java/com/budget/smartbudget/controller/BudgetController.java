package com.budget.smartbudget.controller;

import com.budget.smartbudget.entity.Budget;
import com.budget.smartbudget.service.BudgetService;
import com.budget.smartbudget.dto.BudgetAnalysis;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Budget> addBudget(
            @PathVariable Long userId,
            @RequestBody Budget budget) {

        return ResponseEntity.ok(
                budgetService.addBudget(userId, budget)
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Budget>> getBudgets(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                budgetService.getUserBudgets(userId)
        );
    }

    @PutMapping("/{budgetId}/{userId}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long budgetId,
            @PathVariable Long userId,
            @RequestBody Budget budget) {

        return ResponseEntity.ok(
                budgetService.updateBudget(
                        budgetId,
                        userId,
                        budget
                )
        );
    }

    @DeleteMapping("/{budgetId}/{userId}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long budgetId,
            @PathVariable Long userId) {

        budgetService.deleteBudget(budgetId, userId);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analysis/{userId}")
    public ResponseEntity<List<BudgetAnalysis>> getBudgetAnalysis(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                budgetService.getBudgetAnalysis(userId)
        );
    }
}