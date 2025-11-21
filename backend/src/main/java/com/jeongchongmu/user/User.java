package com.jeongchongmu.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;


@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String bankName;
    private String accountNumber;

    @Column(nullable = false)
    private String name;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;


    // @Builder
    User(String email, String password, String name){
        this.email = email;
        this.password = password;
        this.name = name;
    }

    public void updateProfile(String name, String bankName, String accountNumber){
        if(name != null){
            this.name = name;
        }
        if(bankName != null){
            this.bankName = bankName;
        }
        if(accountNumber != null){
            this.accountNumber = accountNumber;
        }
    }
}

