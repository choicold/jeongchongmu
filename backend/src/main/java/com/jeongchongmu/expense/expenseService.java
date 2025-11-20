package com.jeongchongmu.expense;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.domain.group.repository.GroupMemberRepository;
import com.jeongchongmu.domain.group.repository.GroupRepository;
import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.JPA.ExpenseItem;
import com.jeongchongmu.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.expense.JPA.Tag;
import com.jeongchongmu.expense.Repository.TagRepository;
import com.jeongchongmu.expense.dto.ExpenseCreateDTO;
import com.jeongchongmu.expense.dto.ExpenseSimpleDTO;
import com.jeongchongmu.expense.dto.ExpenseUpdateDTO;
import com.jeongchongmu.expense.dto.ExpenseDetailDTO;
import com.jeongchongmu.user.User;
import com.jeongchongmu.expense.Repository.ExpenseRepository;
import com.jeongchongmu.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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
public class expenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final TagRepository tagRepository;

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

        // 4. [태그 처리] (신규)
        //    DTO로 받은 '태그 이름' 목록을 'Tag 엔티티' 셋으로 변환
        Set<Tag> tags = processTags(group, dto.tagNames());

        // 5. Expense 객체 생성
        Expense expense = Expense.builder()
                .title(dto.title())
                .amount(dto.amount())
                .expenseData(dto.expenseData())
                .payer(payer)
                .group(group)
                .receiptUrl(dto.receiptUrl())
                .build();

        // 6. Item 추가
        dto.items().forEach(item -> expense.addItem(ExpenseItem.builder()
                .name(item.name()).price(item.price()).quantity(item.quantity())
                .build()));

        // 7. Participant 추가
        dto.participantIds().forEach(id -> expense.addParticipant(
                new ExpenseParticipant(expense, userRepository.getReferenceById(id))));

        // 8. Tag 추가
        tags.forEach(expense::addTag);

        // 9. 저장 (Cascade)
        Expense savedExpense = expenseRepository.save(expense);

        // 10. 생성된 상세 DTO 반환
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

        // 3. [삭제하기]
        expenseRepository.delete(expense);
    }


    /** [수정]기능
     *  group, 지출자 뺌
     *
     *  admin, 지출자만 가능
     *  dirty checking 사용
     */
    @Transactional
    public ExpenseDetailDTO updateExpense(ExpenseUpdateDTO dto, Long expenseId, Long currentUserId) {

        // 1. 원본 조회 (Fetch Join으로 Tags까지 모두 가져옴)
        Expense expense = expenseRepository.findByIdWithDetails(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        // 2. 권한 검증
        checkUpdateAndDeletePermission(expense, currentUserId);

        // 3. 기본 정보 수정 (Dirty Checking)
        expense.updateInfo(dto.title(), dto.amount(), dto.expenseData());

        // 4. 자식 리스트 (Item, Participant) 전체 대체
        expense.getItems().clear();
        expense.getParticipants().clear();

        dto.items().forEach(item -> expense.addItem(ExpenseItem.builder()
                .name(item.name()).price(item.price()).quantity(item.quantity())
                .build()));

        Group group = expense.getGroup(); // 소속 그룹은 불변
        dto.participantIds().forEach(id -> {
            User user = userRepository.getReferenceById(id);
            if (!groupMemberRepository.existsByUserAndGroup(user, group)) {
                throw new IllegalArgumentException("참여자가 그룹의 멤버가 아닙니다.");
            }
            expense.addParticipant(new ExpenseParticipant(expense, user));
        });

        // 5. [태그 수정]
        //    기존 태그 연결을 모두 끊고, DTO의 새 태그 목록으로 대체
        expense.clearTags(); // (Expense 엔티티의 헬퍼 메서드 호출)
        Set<Tag> newTags = processTags(group, dto.tagNames());
        newTags.forEach(expense::addTag);

        // 6. @Transactional 종료 시 자동 UPDATE

        // 7. 수정된 DTO 반환
        return ExpenseDetailDTO.fromEntity(expense);

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

        // 4. Simple DTO 리스트로 변환하여 반환
        return expenses.stream()
                .map(ExpenseSimpleDTO::fromEntity)
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

        // 3. DTO의 정적 팩토리 메서드를 사용해 변환 후 반환
        return ExpenseDetailDTO.fromEntity(expense);
    }


    /** [신규] 태그 처리 헬퍼 메서드
     * 태그 이름 목록을 받아, find/create 후 Set<Tag>로 반환
     */
    private Set<Tag> processTags(Group group, List<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) {
            return Set.of(); // 빈 Set 반환
        }

        return tagNames.stream()
                .map(String::trim) // 공백 제거
                .distinct() // 중복 제거
                .map(tagName ->
                        // 1. 그룹 내에서 태그를 검색
                        tagRepository.findByGroupAndName(group, tagName)
                                // 2. 없으면 새로 생성하여 저장
                                .orElseGet(() -> tagRepository.save(
                                        Tag.builder().group(group).name(tagName).build()
                                ))
                )
                .collect(Collectors.toSet());
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
}
