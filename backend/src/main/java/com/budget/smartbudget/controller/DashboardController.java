package com.budget.smartbudget.controller;

import com.budget.smartbudget.dto.DashboardSummary;
import com.budget.smartbudget.dto.CategoryExpense;
import com.budget.smartbudget.dto.MonthlySummary;
import com.budget.smartbudget.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }


    // ================================
    // DASHBOARD SUMMARY
    // ================================

    @GetMapping("/{userId}")
    public ResponseEntity<DashboardSummary> getDashboard(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                dashboardService.getDashboard(userId)
        );
    }


    // ================================
    // EXPENSE BY CATEGORY
    // ================================

    @GetMapping("/{userId}/expenses")
    public ResponseEntity<List<CategoryExpense>> getCategoryExpenses(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                dashboardService.getCategoryExpenses(userId)
        );
    }


    // ================================
    // MONTHLY SUMMARY
    // ================================

    @GetMapping("/{userId}/monthly-summary")
    public ResponseEntity<List<MonthlySummary>> getMonthlySummary(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                dashboardService.getMonthlySummary(userId)
        );
    }

}

