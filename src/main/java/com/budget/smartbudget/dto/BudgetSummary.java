package com.budget.smartbudget.dto;

public class BudgetSummary {

    private Double totalIncome;
    private Double totalExpense;
    private Double balance;

    public BudgetSummary(Double totalIncome, Double totalExpense) {
        this.totalIncome = totalIncome;
        this.totalExpense = totalExpense;
        this.balance = totalIncome - totalExpense;
    }

    public Double getTotalIncome() {
        return totalIncome;
    }

    public Double getTotalExpense() {
        return totalExpense;
    }

    public Double getBalance() {
        return balance;
    }
}
