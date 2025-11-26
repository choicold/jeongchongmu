package com.jeongchongmu.domain.expense.Repository;

import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.expense.JPA.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    // [필수] 특정 그룹 내에서 이름으로 태그를 찾는 메서드
    // (Service에서 태그를 생성/조회할 때 중복을 피하기 위해 사용)
    Optional<Tag> findByGroupAndName(Group group, String name);

    // 특정 그룹에 속한 모든 태그를 찾는 메서드
    List<Tag> findByGroup(Group group);

    // 그룹에 속한 모든 태그 삭제
    void deleteByGroup(Group group);
}