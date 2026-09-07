package com.budget.smartbudget.service;

import com.budget.smartbudget.dto.CategoryExpense;
import com.budget.smartbudget.dto.DashboardSummary;
import com.budget.smartbudget.dto.MonthlySummary;
import com.budget.smartbudget.entity.Expense;
import com.budget.smartbudget.entity.Income;
import com.budget.smartbudget.entity.User;
import com.budget.smartbudget.repository.ExpenseRepository;
import com.budget.smartbudget.repository.IncomeRepository;
import com.budget.smartbudget.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;

    public DashboardService(UserRepository userRepository,
                            IncomeRepository incomeRepository,
                            ExpenseRepository expenseRepository) {

        this.userRepository = userRepository;
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
    }


    // =====================================================
    // DASHBOARD SUMMARY
    // =====================================================

    public DashboardSummary getDashboard(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Income> incomes =
                incomeRepository.findByUser(user);

        List<Expense> expenses =
                expenseRepository.findByUser(user);

        double totalIncome = incomes.stream()
                .mapToDouble(Income::getAmount)
                .sum();

        double totalExpenses = expenses.stream()
                .mapToDouble(Expense::getAmount)
                .sum();

        return new DashboardSummary(
                totalIncome,
                totalExpenses
        );
    }


    // =====================================================
    // EXPENSE BY CATEGORY
    // =====================================================

    public List<CategoryExpense> getCategoryExpenses(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Expense> expenses =
                expenseRepository.findByUser(user);

        Map<String, Double> categoryTotals =
                expenses.stream()
                        .collect(Collectors.groupingBy(
                                expense ->
                                        expense.getCategory().trim().toLowerCase(),
                                Collectors.summingDouble(
                                        Expense::getAmount
                                )
                        ));

        List<CategoryExpense> result =
                new ArrayList<>();

        categoryTotals.forEach((category, amount) -> {

            String displayCategory =
                    category.substring(0, 1).toUpperCase()
                            + category.substring(1);

            result.add(
                    new CategoryExpense(
                            displayCategory,
                            amount
                    )
            );
        });

        return result;
    }


    // =====================================================
    // MONTHLY SUMMARY
    // =====================================================

    public List<MonthlySummary> getMonthlySummary(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Income> incomes =
                incomeRepository.findByUser(user);

        List<Expense> expenses =
                expenseRepository.findByUser(user);


        // -------------------------------------------------
        // Store monthly income
        // -------------------------------------------------

        Map<YearMonth, Double> monthlyIncome =
                new TreeMap<>();

        for (Income income : incomes) {

            if (income.getDate() == null) {
                continue;
            }

            YearMonth month =
                    YearMonth.from(income.getDate());

            monthlyIncome.merge(
                    month,
                    income.getAmount(),
                    Double::sum
            );
        }


        // -------------------------------------------------
        // Store monthly expenses
        // -------------------------------------------------

        Map<YearMonth, Double> monthlyExpenses =
                new TreeMap<>();

        for (Expense expense : expenses) {

            if (expense.getDate() == null) {
                continue;
            }

            YearMonth month =
                    YearMonth.from(expense.getDate());

            monthlyExpenses.merge(
                    month,
                    expense.getAmount(),
                    Double::sum
            );
        }


        // -------------------------------------------------
        // Combine income + expenses months
        // -------------------------------------------------

        TreeMap<YearMonth, Boolean> allMonths =
                new TreeMap<>();

        for (YearMonth month : monthlyIncome.keySet()) {
            allMonths.put(month, true);
        }

        for (YearMonth month : monthlyExpenses.keySet()) {
            allMonths.put(month, true);
        }


        // -------------------------------------------------
        // Create MonthlySummary list
        // -------------------------------------------------

        List<MonthlySummary> result =
                new ArrayList<>();

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("MMMM yyyy");


        for (YearMonth month : allMonths.keySet()) {

            double income =
                    monthlyIncome.getOrDefault(
                            month,
                            0.0
                    );

            double expensesAmount =
                    monthlyExpenses.getOrDefault(
                            month,
                            0.0
                    );

            result.add(
                    new MonthlySummary(
                            month.format(formatter),
                            income,
                            expensesAmount
                    )
            );
        }

        return result;
    }
}