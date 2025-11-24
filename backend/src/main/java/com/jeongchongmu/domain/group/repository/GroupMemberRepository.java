package com.jeongchongmu.domain.group.repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    // GroupMember를 통해 유저, 그룹, 역할을 조회 가능

    // 특정 그룹의 모든 멤버 조회
    List<GroupMember> findByGroup(Group group);

    // 특정 유저가 속한 그룹 목록 조회
    List<GroupMember> findByUser(User user);

    // 특정 유저가 특정 그룹의 멤버인지 확인
    boolean existsByUserAndGroup(User user, Group group);

    // 특정 그룹의 멤버 조회
    Optional<GroupMember> findByGroupAndUser(Group group, User user);

    // 특정 그룹의 OWNER 조회
    // -> Role에 Member가 들어갈 경우 Optional에 의해 조회 결과가 단일 값만 나와야 하는데 복수의 값이 나올 수 있음. 그렇게 되면 에러 발생하니 사용 시 유의 필요
    Optional<GroupMember> findByGroupAndRole(Group group, Role role);

    // 특정 그룹의 MEMBER 목록 조회
    List<GroupMember> findAllByGroupAndRole(Group group, Role role);

    // 특정 그룹의 멤버 수
    long countByGroup(Group group);

    // 특정 그룹에서 특정 유저를 삭제
    void deleteByGroupAndUser(Group group, User user);
}
