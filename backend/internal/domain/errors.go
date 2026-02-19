package domain

import "errors"

var (
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidAmount      = errors.New("amount must be greater than 0")
	ErrInvalidType        = errors.New("type must be 'income' or 'expense'")
	ErrInvalidDate        = errors.New("invalid date format")
	ErrOwnershipViolation = errors.New("you do not own this resource")
	ErrDuplicateEntry     = errors.New("duplicate entry")
	ErrInvalidCurrency    = errors.New("invalid currency code")
	ErrInvalidCategory    = errors.New("invalid category name")
	ErrInvalidAccount     = errors.New("invalid account name")
)
