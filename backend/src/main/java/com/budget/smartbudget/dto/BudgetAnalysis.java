package com.budget.smartbudget.dto;

public class BudgetAnalysis {

    private String category;
    private Double budget;
    private Double spent;
    private Double remaining;
    private Double usagePercentage;
    private String status;

    public BudgetAnalysis(String category,
                          Double budget,
                          Double spent) {

        this.category = category;
        this.budget = budget;
        this.spent = spent;

        this.remaining = budget - spent;

        this.usagePercentage = budget == 0
                ? 0
                : (spent / budget) * 100;

        if (usagePercentage >= 100) {
            this.status = "OVER BUDGET";
        } else if (usagePercentage >= 80) {
            this.status = "WARNING";
        } else {
            this.status = "SAFE";
        }
    }

    public String getCategory() {
        return category;
    }

    public Double getBudget() {
        return budget;
    }

    public Double getSpent() {
        return spent;
    }

    public Double getRemaining() {
        return remaining;
    }

    public Double getUsagePercentage() {
        return usagePercentage;
    }

    public String getStatus() {
        return status;
    }
}
