package com.budget.smartbudget.controller;

import com.budget.smartbudget.entity.Expense;
import com.budget.smartbudget.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Expense> addExpense(
            @PathVariable Long userId,
            @RequestBody Expense expense) {

        return ResponseEntity.ok(
                expenseService.addExpense(userId, expense)
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Expense>> getExpenses(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                expenseService.getUserExpenses(userId)
        );
    }

    @PutMapping("/{expenseId}/{userId}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long expenseId,
            @PathVariable Long userId,
            @RequestBody Expense expense) {

        return ResponseEntity.ok(
                expenseService.updateExpense(
                        expenseId,
                        userId,
                        expense
                )
        );
    }

    @DeleteMapping("/{expenseId}/{userId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long expenseId,
            @PathVariable Long userId) {

        expenseService.deleteExpense(expenseId, userId);

        return ResponseEntity.noContent().build();
    }
}