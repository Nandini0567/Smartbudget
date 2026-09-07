package com.budget.smartbudget.dto;

public class CategoryExpense {

    private String category;
    private Double amount;

    public CategoryExpense(String category, Double amount) {
        this.category = category;
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public Double getAmount() {
        return amount;
    }
}