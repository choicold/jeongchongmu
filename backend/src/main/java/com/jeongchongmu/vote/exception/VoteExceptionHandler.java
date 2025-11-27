package com.jeongchongmu.vote.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice(basePackages = "com.jeongchongmu.vote")
public class VoteExceptionHandler {

    @ExceptionHandler(VoteNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleVoteNotFound(VoteNotFoundException e) {
        return createErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(VoteOptionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleVoteOptionNotFound(VoteOptionNotFoundException e) {
        return createErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(ExpenseNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleExpenseNotFound(ExpenseNotFoundException e) {
        return createErrorResponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(VoteAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(VoteAccessDeniedException e) {
        log.warn("투표 접근 거부: {}", e.getMessage());
        return createErrorResponse(HttpStatus.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(VoteAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyExists(VoteAlreadyExistsException e) {
        return createErrorResponse(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(VoteAlreadyClosedException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyClosed(VoteAlreadyClosedException e) {
        return createErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(VoteException.class)
    public ResponseEntity<Map<String, Object>> handleVoteException(VoteException e) {
        log.error("투표 관련 예외 발생: {}", e.getMessage(), e);
        return createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }

    private ResponseEntity<Map<String, Object>> createErrorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}