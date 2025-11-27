package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class VoteAlreadyExistsException extends VoteException {
    public VoteAlreadyExistsException(String message) {
        super(message);
    }
}