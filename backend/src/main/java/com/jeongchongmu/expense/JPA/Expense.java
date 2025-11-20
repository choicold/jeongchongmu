package com.jeongchongmu.expense.JPA;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Getter
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

    @Column(nullable = false)
    private Long amount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime expenseData;

    @Column(length = 1000)
    private String receiptUrl;

    /** [연관관계]
     * expense-expenseItem 1:N
     * expense-expenseParticipant 1:N
     * expense-expenseTag N:N
     */
    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseParticipant> participants = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "ExpenseTags", // 매핑 테이블 이름
            joinColumns = @JoinColumn(name = "expense_id"), // Expense(현재 엔티티)의 FK
            inverseJoinColumns = @JoinColumn(name = "tag_id")  // Tag(반대편 엔티티)의 FK
    )
    private Set<Tag> tags = new HashSet<>();


    // ---- 편의성 메소드 ---
    public void addItem(ExpenseItem item) {
        this.items.add(item);
        item.setExpense(this);
    }

    public void addParticipant(ExpenseParticipant participant) {
        this.participants.add(participant);
        // ExpenseParticipant는 생성자에서 이미 expense를 설정하므로 여기서는 생략
    }

    public void addTag(Tag tag) {
        this.tags.add(tag);
        tag.getExpenses().add(this); // 양방향 관계 설정
    }

    public void removeTag(Tag tag) {
        this.tags.remove(tag);
        tag.getExpenses().remove(this); // 양방향 관계 설정
    }

    public void clearTags() {
        // 동시성 문제(ConcurrentModificationException) 방지를 위해 복사본 사용
        for (Tag tag : new HashSet<>(this.tags)) {
            this.removeTag(tag);
        }
    }

    //expenceService의 updateExpense에 사용 => setter 사용 막기 위함
    public void updateInfo(String title, Long amount, LocalDateTime expenseData) {
        if (title != null) {
            this.title = title;
        }
        if (amount != null) {
            this.amount = amount;
        }
        if (expenseData != null) {
            this.expenseData = expenseData;
        }
    }





}
