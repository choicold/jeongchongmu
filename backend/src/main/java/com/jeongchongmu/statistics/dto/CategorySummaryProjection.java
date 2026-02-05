package com.jeongchongmu.statistics.dto;

/**
 * Native Query 결과를 매핑하기 위한 Projection 인터페이스
 */
public interface CategorySummaryProjection {
    String getTagName();
    Long getTotalAmount();
}
