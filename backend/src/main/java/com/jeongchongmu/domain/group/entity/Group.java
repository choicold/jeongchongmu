package com.jeongchongmu.domain.group.entity;

import com.jeongchongmu.common.BaseEntity;
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="groups",
        indexes = {
        @Index(name="idx_creator_id", columnList="creator_id")
        })
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Group extends BaseEntity {
    @Id
    @GeneratedValue(
            strategy= GenerationType.SEQUENCE,
            generator = "group_seq_generator"
    )
    @SequenceGenerator(
            name = "sequence-generator",
            sequenceName = "groups_id_seq",
            allocationSize = 10
    )
    private Long id;

    @Column(nullable=false, length=50)
    private String name;

    @Column(length=1000)
    private String description;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="creater_id", nullable=false)
    private User creator;

    @OneToMany(mappedBy="group", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default
    private List<GroupMember> members = new ArrayList<>();

    public void updateInfo(String name, String description) {
        this.name = name;
        this.description = description;
    }
}
