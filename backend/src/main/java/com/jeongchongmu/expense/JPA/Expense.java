package com.jeongchongmu.expense.JPA;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Getter
@Setter
@Entity
@Table(name = "Expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id", nullable = false)
    private User payer;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime expenseData;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipant> participants = new ArrayList<>();

    public void addItem(ExpenseItem item) {
        this.items.add(item);
        item.setExpense(this);
    }

    public void addParticipant(ExpenseParticipant participant) {
        this.participants.add(participant);
        // ExpenseParticipant는 생성자에서 이미 expense를 설정하므로 여기서는 생략
    }




}
