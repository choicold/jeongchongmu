package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class VoteAlreadyClosedException extends VoteException {
    public VoteAlreadyClosedException(String message) {
        super(message);
    }
}