package com.jeongchongmu.domain.group.repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    // 특정 유저가 생성한 그룹 목록 조회
    List<Group> findByCreator(User creator);

    // 그룹 이름으로 검색 조회
    List<Group> findByNameContaining(String keyword);

    // 그룹 생성 시간을 기준으로 위에서 아래로 나열 -> 나중에 정산 엔티티 나오면 정산이 업데이트된 최신 순으로 위에서 아래로 나열하도록 수정 예정
    List<Group> findByOrderByCreatedAtDesc();

    // 특정 유저가 관련 모든 그룹 조회
    @Query("SELECT DISTINCT g FROM Group g " +
            "LEFT JOIN g.members m " +
            "WHERE g.creator = :user OR m.user = :user")
    List<Group> findAllGroupsByUser(@Param("user") User user);
}