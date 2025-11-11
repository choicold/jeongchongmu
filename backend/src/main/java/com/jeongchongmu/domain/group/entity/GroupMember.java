package com.jeongchongmu.domain.group.entity;

import com.jeongchongmu.common.BaseEntity;
import com.jeongchongmu.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="group_members",
        uniqueConstraints = {
                @UniqueConstraint(
                        name="uk_user_group",
                        columnNames = {"user_id", "group_id"}
                )
        },
        indexes = {
                @Index(name="idx_user_id", columnList="user_id"),
                @Index(name="idx_group_id", columnList="group_id"),
                @Index(name="idx_role", columnList="role")
        }
)
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class GroupMember extends BaseEntity {
    @Id
    @GeneratedValue(
            strategy=GenerationType.SEQUENCE,
            generator="group_member_seq_generator"
    )
    @SequenceGenerator(
            name="group_member_seq_generator",
            sequenceName="group_members_id_seq",
            allocationSize=20
    )
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="group_id", nullable=false)
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private Role role;

    public void changeRole(Role newRole) {
        this.role = newRole;
    }
}