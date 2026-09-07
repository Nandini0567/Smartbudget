package com.budget.smartbudget.dto;

public class DashboardSummary {

    private Double totalIncome;
    private Double totalExpenses;
    private Double balance;

    public DashboardSummary(Double totalIncome, Double totalExpenses) {
        this.totalIncome = totalIncome;
        this.totalExpenses = totalExpenses;
        this.balance = totalIncome - totalExpenses;
    }

    public Double getTotalIncome() {
        return totalIncome;
    }

    public Double getTotalExpenses() {
        return totalExpenses;
    }

    public Double getBalance() {
        return balance;
    }
}
