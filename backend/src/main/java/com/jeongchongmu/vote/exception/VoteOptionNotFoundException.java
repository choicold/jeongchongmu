package com.jeongchongmu.vote.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class VoteOptionNotFoundException extends VoteException {
    public VoteOptionNotFoundException(String message) {
        super(message);
    }
}