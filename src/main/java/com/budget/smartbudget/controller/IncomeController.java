package com.budget.smartbudget.controller;

import com.budget.smartbudget.entity.Income;
import com.budget.smartbudget.service.IncomeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService incomeService;

    public IncomeController(IncomeService incomeService) {
        this.incomeService = incomeService;
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Income> addIncome(
            @PathVariable Long userId,
            @RequestBody Income income) {

        return ResponseEntity.ok(
                incomeService.addIncome(userId, income)
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Income>> getIncome(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                incomeService.getUserIncome(userId)
        );
    }

    @PutMapping("/{incomeId}/{userId}")
    public ResponseEntity<Income> updateIncome(
            @PathVariable Long incomeId,
            @PathVariable Long userId,
            @RequestBody Income income) {

        return ResponseEntity.ok(
                incomeService.updateIncome(
                        incomeId,
                        userId,
                        income
                )
        );
    }

    @DeleteMapping("/{incomeId}/{userId}")
    public ResponseEntity<Void> deleteIncome(
            @PathVariable Long incomeId,
            @PathVariable Long userId) {

        incomeService.deleteIncome(incomeId, userId);

        return ResponseEntity.noContent().build();
    }
}