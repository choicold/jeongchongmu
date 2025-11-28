package com.jeongchongmu.domain.expense;
import com.jeongchongmu.domain.expense.dto.*;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.domain.group.repository.GroupRepository;
import com.jeongchongmu.domain.expense.JPA.Expense;
import com.jeongchongmu.domain.expense.JPA.ExpenseItem;
import com.jeongchongmu.domain.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.domain.expense.JPA.Tag;
import com.jeongchongmu.domain.expense.Repository.TagRepository;
import com.jeongchongmu.settlement.entity.Settlement;
import com.jeongchongmu.settlement.repository.SettlementRepository;
import com.jeongchongmu.user.User;
import com.jeongchongmu.domain.expense.Repository.ExpenseRepository;
import com.jeongchongmu.user.UserRepository;
import com.jeongchongmu.vote.entity.Vote;
import com.jeongchongmu.vote.repository.VoteRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 1. [저장] createExpense()
 * 2. [삭제] deleteExpense()
 * 3. [수정] updateExpense()
 * 4. [조회-간단] getExpensesByGroup()
 * 5. [조회-상세] getExpenseDetail()
 * 6. [헬퍼함수-tag] processTags()
 * 7. [헬퍼함수-권한] checkUpdateAndDeletePermission()
 * 8. [헬퍼함수-권한] checkReadPermission()
 */


@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final TagRepository tagRepository;
    private final SettlementRepository settlementRepository;
    private final VoteRepository voteRepository;

    /** [저장]기능
     * 지출 + 지출item + 참여자를 모두 저장함
     */
    @Transactional
    public ExpenseDetailDTO createExpense(ExpenseCreateDTO dto, Long payerId){

        // 1. [검증] 그룹 존재 여부
        Group group = groupRepository.findById(dto.groupId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 그룹입니다."));

        // 2. [검증] Payer가 그룹 멤버인지 확인
        User payer = userRepository.getReferenceById(payerId);
        if (!groupMemberRepository.existsByUserAndGroup(payer, group)) {
            throw new IllegalArgumentException("지출자가 해당 그룹의 멤버가 아닙니다.");
        }

        // 3. [검증] Participants가 그룹 멤버인지 확인
        for (Long participantId : dto.participantIds()) {
            if (!groupMemberRepository.existsByUserAndGroup(userRepository.getReferenceById(participantId), group)) {
                throw new IllegalArgumentException("참여자가 그룹의 멤버가 아닙니다.");
            }
        }

        // 4. [검증] 총액 일치 여부 (세부 항목이 있을 때만 검증)
        if (dto.items() != null && !dto.items().isEmpty()) {
            long itemsSum = dto.items().stream().mapToLong(item -> item.price() * item.quantity()).sum();
            if (itemsSum != dto.amount()) {
                throw new IllegalArgumentException(String.format("총액(%d)과 아이템 합계(%d)가 다릅니다.", dto.amount(), itemsSum));
            }
        }

        // 5. [태그 처리]
        Set<Tag> tags = processTags(group, dto.tagNames());

        // 6. Expense 객체 생성
        Expense expense = Expense.builder()
                .title(dto.title())
                .amount(dto.amount())
                .expenseData(dto.expenseData())
                .payer(payer)
                .group(group)
                .receiptUrl(dto.receiptUrl())
                .build();

        // 7. Item 추가
        dto.items().forEach(item -> expense.addItem(ExpenseItem.builder()
                .name(item.name())
                .price(item.price())
                .quantity(item.quantity())
                .build()));

        // 8. Participant 추가
        dto.participantIds().forEach(id -> expense.addParticipant(
                new ExpenseParticipant(expense, userRepository.getReferenceById(id))));

        // 9. Tag 추가
        tags.forEach(expense::addTag);

        // 10. 저장
        Expense savedExpense = expenseRepository.save(expense);

        return ExpenseDetailDTO.fromEntity(savedExpense);


    }


    /** [삭제] 기능
     *  부모만 삭제되면 자식들 모두 삭제됨
     *  권한이 있는지 check함 - admin+지출자만 삭제
     */
    @Transactional
    public void deleteExpense(Long expenseId, Long currentUserId) {

        // 1. [조회] 삭제할 대상이 존재하는지
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 지출 내역을 찾을 수 없습니다. (ID: " + expenseId + ")"));

        // 2. [권한검증]
        checkUpdateAndDeletePermission(expense, currentUserId);

        // 투표가 존재하는지 확인 (Optional 반환 가정)
        voteRepository.findByExpense(expense).ifPresent(vote -> {
            // 투표를 삭제하면 -> Cascade 설정에 의해 VoteOption, UserVote 등도 같이 삭제되어야 함
            voteRepository.delete(vote);
        });

        // 3. [삭제하기]
        expenseRepository.delete(expense);
    }


    /** [수정]기능
     *  group, 지출자는 수정 못함
     *
     *  admin, 지출자만 가능
     *  dirty checking 사용
     */
    @Transactional
    public boolean updateExpense(ExpenseUpdateDTO dto, Long expenseId, Long currentUserId) {

        // 1. 원본 조회
        Expense expense = expenseRepository.findByIdWithDetails(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        // 2. 권한 검증
        checkUpdateAndDeletePermission(expense, currentUserId);

        // 3. [검증] 데이터 정합성 확인 (중요!)
        //    DTO에 없는 값은 기존 Entity 값을 사용하여 비교해야 안전함
        validateConsistency(expense, dto);

        // 4. 기본 정보 수정 (Dirty Checking)
        expense.updateInfo(dto.title(), dto.amount(), dto.expenseData());

        // 5. 아이템 리스트 수정 (Null 체크)
        if (dto.items() != null) {
            expense.getItems().clear();
            dto.items().forEach(item -> expense.addItem(ExpenseItem.builder()
                    .name(item.name())
                    .price(item.price())
                    .quantity(item.quantity())
                    .build()));
        }

        // 6. 참여자 리스트 수정
        if (dto.participantIds() != null) {
            Group group = expense.getGroup();

            // 6-1. [검증] 요청된 모든 ID가 그룹 멤버인지 확인
            for (Long id : dto.participantIds()) {
                if (!groupMemberRepository.existsByUserAndGroup(userRepository.getReferenceById(id), group)) {
                    throw new IllegalArgumentException("그룹 멤버가 아닌 사용자가 포함되어 있습니다. (ID: " + id + ")");
                }
            }

            // 6-2. [삭제] "기존엔 있는데, 요청(DTO)엔 없는 사람" 찾아서 제거
            // (Java 16 이상이면 .toList(), 그 이하면 .collect(Collectors.toList()) 사용)
            List<ExpenseParticipant> toRemove = expense.getParticipants().stream()
                    .filter(p -> !dto.participantIds().contains(p.getUser().getId()))
                    .toList();

            for (ExpenseParticipant p : toRemove) {
                // Expense 엔티티의 removeParticipant 메서드 호출 (양방향 해제)
                expense.removeParticipant(p);
            }

            // 6-3. [추가] "요청(DTO)엔 있는데, 기존엔 없는 사람" 찾아서 추가
            // 현재 남아있는 사람들의 ID 목록
            Set<Long> currentIds = expense.getParticipants().stream()
                    .map(p -> p.getUser().getId())
                    .collect(Collectors.toSet());

            for (Long id : dto.participantIds()) {
                if (!currentIds.contains(id)) {
                    // 없는 사람만 새로 생성 (new) -> 충돌 방지 핵심!
                    User user = userRepository.getReferenceById(id);
                    expense.addParticipant(new ExpenseParticipant(expense, user));
                }
            }
        }

        // 7. 태그 수정 (Null 체크)
        if (dto.tagNames() != null) {
            expense.clearTags();
            Set<Tag> newTags = processTags(expense.getGroup(), dto.tagNames());
            newTags.forEach(expense::addTag);
        }

        return true;
    }

    /**
     * [조회 1: 목록]
     * 특정 그룹의 모든 지출 내역을 '간단한' 목록으로 조회합니다.
     * (N+1 방지를 위해 Payer만 Fetch Join)
     */
    public List<ExpenseSimpleDTO> getExpensesByGroup(Long groupId, User currentUser) {

        // 1. Group '껍데기' 조회
        Group group = groupRepository.getReferenceById(groupId);

        // 2. [권한 검증] 현재 유저가 이 그룹의 멤버인지 확인
        checkReadPermission(group, currentUser);

        // 3. Repository에서 'Payer'만 Fetch Join하는 쿼리 호출
        //    (수정된 findByGroupWithPayer 메서드 사용)
        List<Expense> expenses = expenseRepository.findByGroupWithPayer(group);

        // 4. Simple DTO 리스트로 변환하여 반환 (settlementId, voteId, isVoteClosed 포함)
        return expenses.stream()
                .map(expense -> {
                    // 각 지출에 대한 정산 정보 조회 (있으면 settlementId, 없으면 null)
                    Optional<Settlement> settlement = settlementRepository.findByExpenseId(expense.getId());
                    Long settlementId = settlement.map(Settlement::getId).orElse(null);

                    // 각 지출에 대한 투표 정보 조회 (있으면 voteId와 isClosed, 없으면 null)
                    Optional<Vote> vote = voteRepository.findByExpense(expense);
                    Long voteId = vote.map(Vote::getId).orElse(null);
                    Boolean isVoteClosed = vote.map(Vote::isClosed).orElse(null);

                    return ExpenseSimpleDTO.fromEntity(expense, settlementId, voteId, isVoteClosed);
                })
                .collect(Collectors.toList());
    }


    /**
     * [조회 2: 상세]
     * 하나의 지출 내역에 대한 모든 상세 정보를 조회합니다.
     * (Items, Participants, Tags 포함 - Fetch Join 사용)
     */
    public ExpenseDetailDTO getExpenseDetail(Long expenseId, User currentUser) {

        // 1. Repository에서 모든 자식을 Fetch Join하는 쿼리 호출
        Expense expense = expenseRepository.findByIdWithDetails(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("지출 내역을 찾을 수 없습니다."));

        // 2. [권한 검증] 현재 유저가 이 그룹의 멤버인지 확인
        checkReadPermission(expense.getGroup(), currentUser);

        // 3. 정산 정보 조회 (있으면 settlementId, 없으면 null)
        Optional<Settlement> settlement = settlementRepository.findByExpenseId(expenseId);
        Long settlementId = settlement.map(Settlement::getId).orElse(null);

        // 4. DTO의 정적 팩토리 메서드를 사용해 변환 후 반환
        return ExpenseDetailDTO.fromEntity(expense, settlementId);
    }


    /** [신규] 태그 처리 헬퍼 메서드
     * 태그 이름 목록을 받아, find/create 후 Set<Tag>로 반환
     * Unique constraint 위반을 안전하게 처리
     */
    private Set<Tag> processTags(Group group, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return Set.of(); // 빈 Set 반환
        }

        return tagNames.stream()
                .map(String::trim) // 공백 제거
                .filter(name -> !name.isEmpty()) // 빈 문자열 제거
                .distinct() // 중복 제거
                .map(tagName -> findOrCreateTag(group, tagName))
                .collect(Collectors.toSet());
    }

    /**
     * 태그를 찾거나 생성 (Unique constraint 위반 안전 처리)
     */
    private Tag findOrCreateTag(Group group, String tagName) {
        // 1. 먼저 기존 태그 조회
        Optional<Tag> existingTag = tagRepository.findByGroupAndName(group, tagName);
        if (existingTag.isPresent()) {
            return existingTag.get();
        }

        // 2. 없으면 새로 생성
        try {
            Tag newTag = Tag.builder()
                    .group(group)
                    .name(tagName)
                    .build();
            return tagRepository.save(newTag);
        } catch (DataIntegrityViolationException e) {
            // 3. 동시성으로 인한 중복 키 오류 시 다시 조회
            // (다른 트랜잭션에서 같은 태그를 생성했거나 sequence 문제)
            return tagRepository.findByGroupAndName(group, tagName)
                    .orElseThrow(() -> new IllegalStateException(
                            "태그 생성 중 오류가 발생했습니다: " + tagName + ". " +
                            "데이터베이스 sequence 동기화가 필요할 수 있습니다.", e));
        }
    }


    /**
     * [권한 확인] 함수 (수정/삭제용)
     * - 규칙 1: Payer(지출 생성자)인지 확인
     * - 규칙 2: Group의 ADMIN인지 확인
     * - 둘 다 아니면 예외를 던져서 작업을 중단시킴
     *
     * @throws IllegalArgumentException 권한이 없을 경우 발생
     */
    private void checkUpdateAndDeletePermission(Expense expense, Long currentUserId) throws IllegalArgumentException {

        // [규칙 1] Payer(지출 생성자)인지 확인
        if (expense.getPayer().getId().equals(currentUserId)) {
            return; // 권한 있음 (통과)
        }

        // [규칙 2] Payer가 아니라면, Group의 ADMIN인지 확인
        // (ID만으로 '껍데기' User 객체를 가져옴)
        User currentUser = userRepository.getReferenceById(currentUserId);
        Group group = expense.getGroup();

        // (방금 추가한 메서드 사용)
        Optional<GroupMember> membership = groupMemberRepository.findByGroupAndUser(group, currentUser);

        if (membership.isPresent() && membership.get().getRole() == Role.OWNER) {
            return; // 권한 있음 (통과)
        }

        // [실패] 둘 다 아니면 예외 발생
        // (요청하신 대로 IllegalArgumentException을 던지도록 수정)
        throw new IllegalArgumentException("이 작업을 수행할 권한이 없습니다.");
    }

    /**
     * [권한 확인] 함수 (읽기용)
     * - 규칙: 사용자가 해당 Group의 Member인지 확인
     * - getExpensesByGroup, getExpenseDetail에서 사용
     *
     * @throws IllegalArgumentException 권한이 없을 경우 발생
     */
    private void checkReadPermission(Group group, User currentUser) throws IllegalArgumentException {

        // GroupMemberRepository를 사용해 멤버인지 확인
        boolean isMember = groupMemberRepository.existsByUserAndGroup(currentUser, group);

        if (!isMember) {
            throw new IllegalArgumentException("이 그룹의 지출 내역을 조회할 권한이 없습니다.");
        }
    }

    /**
     * [수정 시 무결성 검증]
     * 수정 요청된 값(DTO)이 있으면 그것을 쓰고, 없으면 기존(Entity) 값을 사용하여
     * 총액 == 아이템합계 인지 검사
     */
    private void validateConsistency(Expense expense, ExpenseUpdateDTO dto) {
        // 1. 최종 총액 결정 (수정 요청이 있으면 수정값, 없으면 기존값)
        long finalAmount = (dto.amount() != null) ? dto.amount() : expense.getAmount();

        // 2. 최종 아이템 합계 결정
        long finalItemsSum;
        if (dto.items() != null) {
            // 아이템이 수정된다면, 수정될 아이템들의 합계 계산
            finalItemsSum = dto.items().stream()
                    .mapToLong(ExpenseItemDTO::price)
                    .sum();
        } else {
            // 아이템이 수정되지 않는다면, 기존 아이템들의 합계 계산
            finalItemsSum = expense.getItems().stream()
                    .mapToLong(ExpenseItem::getPrice)
                    .sum();
        }

        // 3. 비교
        if (finalAmount != finalItemsSum) {
            throw new IllegalArgumentException(
                    String.format("지출 총액(%d)과 세부 항목의 합계(%d)가 일치하지 않습니다.", finalAmount, finalItemsSum)
            );
        }
    }
}
