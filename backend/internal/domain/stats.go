package domain

type StatsSummary struct {
	TotalIncome  int64  `json:"total_income"`
	TotalExpense int64  `json:"total_expense"`
	NetBalance   int64  `json:"net_balance"`
	Currency     string `json:"currency"`
}

type CategoryStat struct {
	Category   string  `json:"category"`
	Total      int64   `json:"total"`
	Percentage float64 `json:"percentage"`
	Count      int     `json:"count"`
}
