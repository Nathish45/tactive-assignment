package com.canteen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.Clock;

@SpringBootApplication
public class CanteenOrderingApplication {

    public static void main(String[] args) {
        SpringApplication.run(CanteenOrderingApplication.class, args);
    }

    /**
     * Clock is injected as a bean so tests can supply a fixed/mock Clock
     * instead of relying on the real system time. This is what makes the
     * cutoff-time logic (OrderService) reliably testable.
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
