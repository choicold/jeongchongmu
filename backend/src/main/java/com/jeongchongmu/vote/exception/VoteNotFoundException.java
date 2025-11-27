package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class VoteNotFoundException extends VoteException {
    public VoteNotFoundException(String message) {
        super(message);
    }
}