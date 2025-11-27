package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class VoteAccessDeniedException extends VoteException {
    public VoteAccessDeniedException(String message) {
        super(message);
    }
}
