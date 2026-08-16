package com.canteen.exception;

import org.springframework.http.HttpStatus;

public class OrderException extends RuntimeException {

    private final HttpStatus status;

    public OrderException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static OrderException outOfStock(String itemName) {
        return new OrderException("Item '" + itemName + "' is out of stock.", HttpStatus.CONFLICT);
    }

    public static OrderException cutoffPassed() {
        return new OrderException("Ordering has closed for today. The cutoff time has passed.", HttpStatus.CONFLICT);
    }

    public static OrderException dailyLimitExceeded(int limit) {
        return new OrderException("Daily limit of " + limit + " exceeded for this item.", HttpStatus.CONFLICT);
    }

    public static OrderException notFound(String what) {
        return new OrderException(what + " not found.", HttpStatus.NOT_FOUND);
    }

    public static OrderException notOwner() {
        return new OrderException("You do not have permission to modify this order.", HttpStatus.FORBIDDEN);
    }

    public static OrderException cancellationWindowExpired() {
        return new OrderException("Cancellation window has expired for this order.", HttpStatus.CONFLICT);
    }

    public static OrderException alreadyCancelled() {
        return new OrderException("This order is already cancelled.", HttpStatus.CONFLICT);
    }

    public static OrderException concurrentModification() {
        return new OrderException("This item was just updated by another order. Please retry.", HttpStatus.CONFLICT);
    }
}
