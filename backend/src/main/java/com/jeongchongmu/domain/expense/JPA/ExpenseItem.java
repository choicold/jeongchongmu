package com.jeongchongmu.domain.expense.JPA;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "expense_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ExpenseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

}