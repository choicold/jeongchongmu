package com.jeongchongmu.vote.exception;

public abstract class VoteException extends RuntimeException {
    public VoteException(String message) {
        super(message);
    }
}