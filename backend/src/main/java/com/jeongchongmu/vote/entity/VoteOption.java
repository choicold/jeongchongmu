package com.jeongchongmu.vote.entity;

import com.jeongchongmu.expense.JPA.ExpenseItem;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vote_options")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class VoteOption {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vote_id", nullable = false)
    private Vote vote;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_item_id", nullable = false)
    private ExpenseItem expenseItem;
}