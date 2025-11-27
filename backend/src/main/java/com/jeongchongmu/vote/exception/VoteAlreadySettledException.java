package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class VoteAlreadySettledException extends VoteException {
    public VoteAlreadySettledException(String message) {
        super(message);
    }
}