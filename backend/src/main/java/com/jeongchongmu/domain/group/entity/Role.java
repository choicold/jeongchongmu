package com.jeongchongmu.domain.group.entity;

public enum Role {
    OWNER, // 그룹 생성자 및 관리 (그룹 설정, 정산 생성, 멤버 관리 권한)
    MEMBER // 그룹 멤버 (정산 생성 가능, 그룹 관리 불가)
}
