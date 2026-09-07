package com.budget.smartbudget.dto;

public class MonthlySummary {

    private String month;
    private double income;
    private double expenses;
    private double savings;

    public MonthlySummary(
            String month,
            double income,
            double expenses) {

        this.month = month;
        this.income = income;
        this.expenses = expenses;
        this.savings = income - expenses;
    }

    public String getMonth() {
        return month;
    }

    public double getIncome() {
        return income;
    }

    public double getExpenses() {
        return expenses;
    }

    public double getSavings() {
        return savings;
    }
}