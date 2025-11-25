package com.jeongchongmu.domain.expense.JPA;

import com.jeongchongmu.domain.group.entity.Group;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Getter
@Table(name = "Tags", uniqueConstraints = {
        @UniqueConstraint(name = "uk_group_id_tag_name",
        columnNames = {"group_id", "name"})
})
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    //tag=> 지출내역 확인시
    @Builder.Default
    @ManyToMany(mappedBy = "tags")
    private Set<Expense> expenses = new HashSet<>();

}
