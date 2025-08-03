package common

func TypeOf[T any](v T) *T {
	return &v
}
