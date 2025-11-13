package com.jeongchongmu.domain.group.repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    // SettlementService가 찾는 바로 그 메서드
    // (GroupMemberRepositoryTest 3번 항목에서 확인)
    boolean existsByUserAndGroup(User user, Group group);
}