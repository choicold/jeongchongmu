package com.jeongchongmu.expense;
import com.jeongchongmu.domain.group.entity.Group;
import com.jeongchongmu.domain.group.entity.GroupMember;
import com.jeongchongmu.domain.group.entity.Role;
import com.jeongchongmu.expense.JPA.Expense;
import com.jeongchongmu.expense.JPA.ExpenseItem;
import com.jeongchongmu.expense.JPA.ExpenseParticipant;
import com.jeongchongmu.expense.dto.ExpenseCreateDTO;
import com.jeongchongmu.expense.dto.ExpenseUpdateDTO;
import com.jeongchongmu.user.User;
import com.jeongchongmu.expense.Repository.ExpenseRepository;
import com.jeongchongmu.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class expenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
//    private final GroupMemberRepository groupMemberRepository;
//    private final GroupRepository groupRepository;

    /** [저장]기능
     * 지출 + 지출item + 참여자를 모두 저장함
     */
    @Transactional
    public Long createExpense(ExpenseCreateDTO dto, Long payerId){

        //userId, groupId => 객체 불러오기 (ORM)
        User payer = userRepository.getReferenceById(payerId);
//        Group group = groupRepository.getReferenceById(dto.getGroupId());

        //expense 객체 생성
        Expense expense = Expense.builder()
                .title(dto.title())
                .amount(dto.amount())
                .payer(payer)
//                .group(group)
                .build();

        //expense에 item 넣기
        dto.items().forEach(item -> {
            expense.addItem(ExpenseItem.builder()
                    .name(item.name())
                    .price(item.price())
                    .quantity(item.quantity())
                    .build());
        });

        //expense에 참여자 넣기
        dto.participantIds().forEach(id -> {
            User user = userRepository.getReferenceById(id);
            expense.addParticipant(new ExpenseParticipant(expense, user));
        });

        //저장 - item과 participant도 cascade로 저장
        expenseRepository.save(expense);


        // 생성된 지출 ID
        // 사용자가 생성이후 상세페이지에 들어간다면 ExpenseDetailDTO를 반환하는것도 고려해볼만함
        return expense.getId();
    }


    /** [삭제] 기능
     *  부모만 삭제되면 자식들 모두 삭제됨
     *  권한이 있는지 check함 - admin+지출자만 삭제
     */
    @Transactional
    public void deleteExpense(Long expenseId, Long currentUserId) {

        // 1. [조회] 삭제할 대상이 존재하는지, 권한이 있는지 확인
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("삭제할 지출 내역을 찾을 수 없습니다. (ID: " + expenseId + ")"));

        // 2. [권한 검증] 지출자?
        if (expense.getPayer().getId().equals(currentUserId)) {
            expenseRepository.delete(expense); // 👈 deleteById 대신 delete(entity) 사용
            return;
        }

        // 3. [권한 검증] admin?
        User currentUser = userRepository.getReferenceById(currentUserId);
        Group group = expense.getGroup();

//        Optional<GroupMember> membership = groupMemberRepository.findByUserAndGroup(currentUser, group);
//        if (membership.isPresent() && membership.get().getRole() == Role.ADMIN) {
//            expenseRepository.delete(expense);
//            return;
//        }

        // 4. [권한 없음] 오류 발생
        throw new IllegalStateException("이 지출 내역을 삭제할 권한이 없습니다. (지출자 또는 그룹 관리자만 가능)");
    }


    /** [수정]기능
     *  group, 지출자 뺌
     *
     *  admin, 지출자만 가능
     *
     *  dirty checking 사용
     */
    @Transactional
    public void updateExpense(ExpenseUpdateDTO dto, Long expenseId, Long currentUserId) {

        //1. 원본 조회
        Expense expense = expenseRepository.findByIdWithDetails(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        //2. 권한 조회

        //2-1. 지출자?
        if(!(expense.getPayer().getId().equals(currentUserId)))
            throw new IllegalStateException("이 지출 내역을 수정할 권한이 없습니다.");

        //2-2. admin?
        User currentUser = userRepository.getReferenceById(currentUserId);
        Group group = expense.getGroup();

//        Optional<GroupMember> membership = groupMemberRepository.findByUserAndGroup(currentUser, group);
//        if (!(membership.isPresent() && membership.get().getRole() == Role.ADMIN)) {
//            expenseRepository.delete(expense);
//            return;
//        }


        //3. 기본 정보 수정 - dirty checking
        expense.updateInfo(dto.title(),dto.amount(),dto.expenseData());

        //4. item, 참여자 수정 - 삭제 후 다시 넣기

        //4-1. expense의  orphanRemoval 옵션으로 db에서도 삭제됨.
        expense.getItems().clear();
        expense.getParticipants().clear();

        //3-2. item 넣기
        dto.items().forEach(item -> {
            expense.addItem(ExpenseItem.builder()
                    .name(item.name())
                    .price(item.price())
                    .quantity(item.quantity())
                    .build());
        });

        //4-3. participant 넣기
//        Group group = expense.getGroup();

        dto.participantIds().forEach(id -> {
            User user = userRepository.getReferenceById(id);

//            boolean isMember = groupMemberRepository.existsByUserAndGroup(participantUser, group);
//            if (!isMember) {
//                throw new IllegalArgumentException(
//                        "새로 추가된 참여자(ID: " + id + ")가 기존 그룹의 멤버가 아닙니다."
//                );
//            }
            expense.addParticipant(new ExpenseParticipant(expense, user));
        });

        //5. 그냥 종료 알아서 update됨


        //6. 나중에 필요하면 바꾸기
        return;

    }




    //조회
    //expenseRepository.find() - 그룹별 정산 목록만
    //expenseRepository.find() - 특정 정산 + item + 참여인원


    /** [권한 확인] 함수
     *
     *  관리자 or 지출생성자
     *  수정, 삭제에 사용
     */
//    private void checkUpdatePermission(Expense expense, Long currentUserId) throws IllegalArgumentException {
//        // [규칙 1] Payer(지출 생성자)인지 확인
//        if (expense.getPayer().getId().equals(currentUserId)) {
//            return; // 권한 있음 (통과)
//        }
//
//        // [규칙 2] Payer가 아니라면, Group의 ADMIN인지 확인
//        User currentUser = userRepository.getReferenceById(currentUserId);
//        Group group = expense.getGroup();
//
//        Optional<GroupMember> membership = groupMemberRepository.findByUserAndGroup(currentUser, group);
//
//        if (membership.isPresent() && membership.get().getRole() == Role.ADMIN) {
//            return; // 권한 있음 (통과)
//        }
//
//        // [실패] 둘 다 아니면 예외 발생
//        throw new IllegalStateException("권한이 없습니다.");
//    }




}
