package com.budget.smartbudget.service;

import com.budget.smartbudget.entity.Income;
import com.budget.smartbudget.entity.User;
import com.budget.smartbudget.repository.IncomeRepository;
import com.budget.smartbudget.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public IncomeService(IncomeRepository incomeRepository,
                         UserRepository userRepository) {

        this.incomeRepository = incomeRepository;
        this.userRepository = userRepository;
    }

    public Income addIncome(Long userId, Income income) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        income.setUser(user);

        return incomeRepository.save(income);
    }

    public List<Income> getUserIncome(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return incomeRepository.findByUser(user);
    }

    public Income updateIncome(Long incomeId, Long userId, Income updatedIncome) {

        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new RuntimeException("Income not found"));

        if (!income.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        income.setAmount(updatedIncome.getAmount());
        income.setSource(updatedIncome.getSource());
        income.setDescription(updatedIncome.getDescription());
        income.setDate(updatedIncome.getDate());

        return incomeRepository.save(income);
    }

    public void deleteIncome(Long incomeId, Long userId) {

        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new RuntimeException("Income not found"));

        if (!income.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        incomeRepository.delete(income);
    }
}